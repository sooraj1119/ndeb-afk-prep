import os
import random
import asyncio
import json
import traceback
from datetime import datetime
from playwright.async_api import async_playwright
from playwright_stealth import Stealth
import config
import database
import ai_agent
import resume_generator

class LinkedInJobBot:
    def __init__(self, log_callback=None, screenshot_callback=None):
        self.log_callback = log_callback
        self.screenshot_callback = screenshot_callback
        self.browser = None
        self.context = None
        self.page = None
        self.is_running = False
        self.application_count = 0
        
    async def log(self, message: str):
        print(f"[Bot Log] {message}")
        if self.log_callback:
            await self.log_callback(message)
            
    async def capture_screenshot(self, name: str):
        if not self.page:
            return
        try:
            # Create a screenshots directory inside backend
            screenshot_dir = os.path.join(config.BASE_DIR, "screenshots")
            os.makedirs(screenshot_dir, exist_ok=True)
            path = os.path.join(screenshot_dir, f"{name}.png")
            await self.page.screenshot(path=path)
            if self.screenshot_callback:
                await self.screenshot_callback(path)
        except Exception as e:
            await self.log(f"Error capturing screenshot: {e}")

    async def human_delay(self, multiplier=1.0):
        delay = random.uniform(config.HUMAN_DELAY_MIN, config.HUMAN_DELAY_MAX) * multiplier
        await asyncio.sleep(delay)

    async def human_type(self, element, text: str):
        """Types text character-by-character with random delays."""
        # Focus element first
        await element.focus()
        await self.human_delay(0.2)
        # Clear existing text if any
        # Select all and backspace
        await self.page.keyboard.press("Control+A")
        await self.page.keyboard.press("Backspace")
        await self.human_delay(0.2)
        
        for char in text:
            await element.type(char)
            await asyncio.sleep(random.uniform(0.04, 0.12))
        await self.human_delay(0.3)

    async def human_click(self, element):
        """Move mouse to element and click with slight variation."""
        # Scroll to it
        await element.scroll_into_view_if_needed()
        await self.human_delay(0.4)
        box = await element.bounding_box()
        if box:
            # Add small random offset from center
            x = box["x"] + box["width"] / 2 + random.uniform(-5, 5)
            y = box["y"] + box["height"] / 2 + random.uniform(-5, 5)
            await self.page.mouse.move(x, y, steps=10)
            await self.human_delay(0.2)
            await self.page.mouse.down()
            await asyncio.sleep(random.uniform(0.05, 0.15))
            await self.page.mouse.up()
        else:
            await element.click()
        await self.human_delay(0.5)

    async def init_browser(self):
        """Initializes the playwright browser, reusing Chrome profile if exists."""
        self.playwright = await async_playwright().start()
        
        # User Data Directory (Chrome profile) preserves sessions
        user_data_dir = os.path.join(os.environ["USERPROFILE"], "AppData", "Local", "Google", "Chrome", "User Data")
        await self.log(f"Starting browser. Profile path: {user_data_dir}")
        
        # Determine launch arguments
        launch_args = [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-infobars"
        ]
        
        self.context = await self.playwright.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=config.HEADLESS_MODE,
            args=launch_args,
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        )
        
        self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()
        await Stealth().apply_stealth_async(self.page)
        
        # Increase default timeout
        self.page.set_default_timeout(30000)
        await self.log("Browser context established.")

    async def verify_linkedin_login(self) -> bool:
        """Navigates to LinkedIn and checks if logged in. Returns True if logged in."""
        
        # Inject cookie if available in configuration
        if config.LINKEDIN_LI_AT:
            await self.context.add_cookies([{
                'name': 'li_at',
                'value': config.LINKEDIN_LI_AT,
                'domain': '.www.linkedin.com',
                'path': '/'
            }])
            await self.log("Injected li_at session cookie from configuration.")
            
        await self.page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded")
        await self.human_delay(1.5)
        
        # Check if URL contains '/feed/' or has profile avatar
        if "linkedin.com/feed" in self.page.url:
            await self.log("Successfully logged into LinkedIn.")
            return True
            
        await self.log("Not logged in. Redirecting to login page or waiting for manual login...")
        await self.page.goto("https://www.linkedin.com/login", wait_until="domcontentloaded")
        await self.capture_screenshot("linkedin_login_required")
        await self.log("Please log in to your LinkedIn account in the opened browser window. Waiting up to 120 seconds...")
        
        # Wait up to 120s for feed URL
        for _ in range(24):
            if "linkedin.com/feed" in self.page.url:
                await self.log("Manual login detected! Proceeding...")
                return True
            await asyncio.sleep(5)
            
        await self.log("Login timeout. Please verify you are logged in and restart.")
        return False

    async def extract_form_fields(self) -> list:
        """
        Parses the current viewport/modal DOM to locate inputs, selects, and textareas,
        constructing their labels and option lists.
        """
        fields = []
        # Find all inputs, select, textarea elements
        elements = await self.page.locator("input, select, textarea").all()
        
        for idx, el in enumerate(elements):
            # Check visibility
            if not await el.is_visible():
                continue
                
            el_type = await el.get_attribute("type") or ""
            el_name = await el.get_attribute("name") or ""
            el_id = await el.get_attribute("id") or ""
            tag_name = await el.evaluate("node => node.tagName.toLowerCase()")
            
            # Skip submit buttons, hidden fields, file uploads (handled separately)
            if el_type in ["submit", "button", "hidden", "image"]:
                continue
            if el_type == "file":
                continue # We handle resume file uploads manually
                
            # Construct a reliable selector
            if el_id:
                selector = f"#{el_id}"
            elif el_name:
                selector = f"{tag_name}[name='{el_name}']"
            else:
                selector = f"xpath=(//input | //select | //textarea)[{idx + 1}]"
                
            # Locate label
            label = ""
            # 1. Look for label with 'for' attribute
            if el_id:
                label_el = self.page.locator(f"label[for='{el_id}']")
                if await label_el.count() > 0:
                    label = await label_el.first.inner_text()
            
            # 2. If label empty, look for parent label
            if not label:
                try:
                    label = await el.evaluate("node => { let p = node.closest('label'); return p ? p.innerText : ''; }")
                except Exception:
                    pass
                    
            # 3. If label empty, check sibling text or placeholder
            if not label:
                label = await el.get_attribute("placeholder") or ""
            if not label:
                label = await el.get_attribute("aria-label") or ""
            if not label:
                # Get surrounding text as fallback
                try:
                    label = await el.evaluate("node => { let text = node.previousSibling ? node.previousSibling.textContent : ''; return text.trim(); }")
                except Exception:
                    pass
                    
            label = label.strip().replace("\n", " ")
            required = await el.get_attribute("required") is not None or "*" in label
            
            # Extract options if select or radio
            options = []
            if tag_name == "select":
                opt_elements = await el.locator("option").all()
                for opt in opt_elements:
                    val = await opt.get_attribute("value")
                    text = await opt.inner_text()
                    if val and val.strip() and text.strip():
                        options.append(text.strip())
                        
            # If radio group, group them (TBD - simple radio check)
            
            fields.append({
                "selector": selector,
                "type": "select" if tag_name == "select" else (el_type or "text"),
                "label": label,
                "options": options,
                "required": required
            })
            
        return fields

    async def fill_fields_on_page(self, fields_list: list, job_description: str, profile_data: dict, application_id: str) -> dict:
        """
        Queries Gemini for mapping responses to fields, attempts to write them,
        and returns the map of filled values.
        """
        # Fetch learned QA from database
        learned_qa_dict = {}
        for item in database.get_all_learned_qa():
            learned_qa_dict[item["question_text"]] = item["answer"]
            
        # Get AI mapping
        fill_map = ai_agent.analyze_and_fill_form(
            fields_list=fields_list,
            job_description=job_description,
            tailored_resume_json=profile_data,
            learned_qa_dict=learned_qa_dict
        )
        
        await self.log(f"Gemini proposed values for {len(fill_map)} fields.")
        
        filled_values = {}
        for selector, value in fill_map.items():
            try:
                locator = self.page.locator(selector).first
                if await locator.count() == 0:
                    continue
                    
                field_info = next((f for f in fields_list if f["selector"] == selector), None)
                if not field_info:
                    continue
                    
                await locator.scroll_into_view_if_needed()
                
                if field_info["type"] == "select":
                    # Value might be option text, select option matching it
                    options = field_info["options"]
                    if value in options:
                        await locator.select_option(label=value)
                    else:
                        # Find closest match
                        matched = False
                        for opt in options:
                            if str(value).lower() in opt.lower() or opt.lower() in str(value).lower():
                                await locator.select_option(label=opt)
                                value = opt
                                matched = True
                                break
                        if not matched and options:
                            await locator.select_option(index=1) # Fallback to first non-empty option
                            value = options[0]
                elif field_info["type"] == "checkbox":
                    if value is True or str(value).lower() in ["true", "yes", "on", "1"]:
                        await locator.check()
                    else:
                        await locator.uncheck()
                elif field_info["type"] == "radio":
                    pass
                else:
                    # Standard typing text/textarea/tel/email
                    await self.human_type(locator, str(value))
                    
                filled_values[selector] = value
                
                # Save to database to self-learn if success
                database.save_learned_answer(
                    question_text=field_info["label"],
                    options=field_info["options"],
                    answer=str(value),
                    is_success=1
                )
            except Exception as e:
                await self.log(f"Error filling field {selector}: {e}")
                
        return filled_values

    async def handle_resume_upload(self, tailored_resume_path: str) -> bool:
        """Finds file inputs on the page and uploads the tailored resume."""
        file_inputs = await self.page.locator("input[type='file']").all()
        for idx, fi in enumerate(file_inputs):
            if await fi.is_visible():
                try:
                    await self.log(f"Uploading tailored resume to input #{idx}...")
                    await fi.set_input_files(tailored_resume_path)
                    await self.human_delay(1.5)
                    return True
                except Exception as e:
                    await self.log(f"Failed to upload resume to input: {e}")
        return False

    async def handle_easy_apply_dialog(self, job_title: str, company: str, job_description: str, profile_data: dict, tailored_resume_path: str) -> bool:
        """
        Handles the multi-step LinkedIn Easy Apply modal.
        """
        await self.log("Handling LinkedIn Easy Apply dialog...")
        await self.capture_screenshot("easy_apply_opened")
        
        max_steps = 10
        step = 0
        success = False
        
        while step < max_steps:
            step += 1
            await self.log(f"Easy Apply - Step {step}")
            await self.capture_screenshot(f"easy_apply_step_{step}")
            
            # Check if there is a file upload input
            file_upload_visible = await self.page.locator("input[type='file']").is_visible()
            if file_upload_visible:
                await self.handle_resume_upload(tailored_resume_path)
                
            # Extract fields on page
            fields = await self.extract_form_fields()
            if fields:
                await self.log(f"Found {len(fields)} form fields on step {step}.")
                await self.fill_fields_on_page(fields, job_description, profile_data, f"{company}_{job_title}")
                
            # Look for button to proceed
            next_button = self.page.locator("button:has-text('Next')").first
            review_button = self.page.locator("button:has-text('Review')").first
            submit_button = self.page.locator("button:has-text('Submit application')").first
            
            if await submit_button.is_visible():
                await self.log("Submit button visible! Clicking Submit...")
                await self.human_click(submit_button)
                await self.human_delay(3.0)
                await self.capture_screenshot("easy_apply_submitted")
                success = True
                break
                
            if await review_button.is_visible():
                await self.log("Review button visible! Clicking Review...")
                await self.human_click(review_button)
                await self.human_delay(1.5)
                continue
                
            if await next_button.is_visible():
                await self.log("Next button visible! Clicking Next...")
                await self.human_click(next_button)
                await self.human_delay(1.5)
                
                # Check if validation error occurred (dialog didn't advance and shows errors)
                error_elements = await self.page.locator(".artdeco-inline-feedback--error").all()
                if error_elements:
                    await self.log(f"Validation error detected on Step {step}! Trying to resolve...")
                    errors = []
                    for err in error_elements:
                        err_text = await err.inner_text()
                        await self.log(f"Error text: {err_text}")
                    
                continue
                
            # If no buttons are found, check if it's already submitted (dismiss screen shown)
            dismiss_button = self.page.locator("button:has-text('Dismiss'), button[aria-label='Dismiss']").first
            if await dismiss_button.is_visible():
                await self.log("Dismiss button visible. Application appears completed.")
                success = True
                await self.human_click(dismiss_button)
                break
                
            await self.log("No progress buttons found. Aborting dialog.")
            break
            
        # Ensure we close modal if still open
        close_button = self.page.locator("button[aria-label='Dismiss']").first
        if await close_button.is_visible():
            await self.human_click(close_button)
            # Handle confirm cancel if popup appears
            discard_button = self.page.locator("button:has-text('Discard')").first
            if await discard_button.is_visible():
                await self.human_click(discard_button)
                
        return success

    async def search_and_apply_jobs(self):
        """Main orchestrator to search and apply to jobs."""
        self.is_running = True
        
        try:
            await self.init_browser()
            logged_in = await self.verify_linkedin_login()
            if not logged_in:
                self.is_running = False
                return
                
            # Get target queries from database
            profile_data = database.get_profile()
            if not profile_data:
                await self.log("No profile details found in database! Please set up your profile.")
                self.is_running = False
                return
                
            job_titles = profile_data.get("job_titles", ["Software Engineer"])
            locations = profile_data.get("target_locations", ["Toronto, Ontario, Canada"])
            
            for title in job_titles:
                for loc in locations:
                    if not self.is_running:
                        break
                        
                    if self.application_count >= config.DAILY_APPLICATION_CAP:
                        await self.log(f"Daily application cap ({config.DAILY_APPLICATION_CAP}) reached. Stopping.")
                        break
                        
                    await self.log(f"Searching for '{title}' in '{loc}'...")
                    
                    # Construct search URL (Easy Apply filter included)
                    search_url = f"https://www.linkedin.com/jobs/search/?keywords={title.replace(' ', '%20')}&location={loc.replace(' ', '%20')}&f_LF=f_AL"
                    await self.page.goto(search_url, wait_until="domcontentloaded")
                    await self.human_delay(2.0)
                    
                    # Scroll job list to load lazy items
                    try:
                        job_list_container = self.page.locator(".jobs-search-results-list")
                        if await job_list_container.count() > 0:
                            for i in range(3):
                                await job_list_container.evaluate("node => node.scrollTop = node.scrollHeight")
                                await self.human_delay(1.0)
                    except Exception:
                        pass
                        
                    # Extract job card links
                    job_cards = await self.page.locator(".job-card-container").all()
                    await self.log(f"Found {len(job_cards)} job cards in search view.")
                    
                    for idx, card in enumerate(job_cards):
                        if not self.is_running:
                            break
                        if self.application_count >= config.DAILY_APPLICATION_CAP:
                            break
                            
                        try:
                            # Highlight and click job card
                            await self.human_click(card)
                            await self.human_delay(1.5)
                            
                            # Extract Job details
                            job_id = await card.get_attribute("data-job-id")
                            if not job_id:
                                link_el = card.locator("a.job-card-container__link").first
                                href = await link_el.get_attribute("href")
                                if href:
                                    job_id = href.split("/view/")[-1].split("/")[0]
                            
                            if not job_id:
                                job_id = f"custom_id_{datetime.now().timestamp()}"
                                
                            # Check database if already applied
                            apps = database.get_applications()
                            if any(app["job_id"] == job_id for app in apps):
                                await self.log(f"Already applied to job ID {job_id}. Skipping.")
                                continue
                                
                            job_title_text = await self.page.locator(".job-details-jobs-unified-top-card__job-title").first.inner_text()
                            company_text = await self.page.locator(".job-details-jobs-unified-top-card__company-name").first.inner_text()
                            
                            job_title_text = job_title_text.strip()
                            company_text = company_text.strip()
                            
                            await self.log(f"Processing job: {job_title_text} at {company_text} (ID: {job_id})")
                            
                            desc_element = self.page.locator(".jobs-description-content__text").first
                            job_desc_text = await desc_element.inner_text() if await desc_element.count() > 0 else ""
                            
                            # --- Step A: Tailor the Resume ---
                            await self.log("Generating tailored resume for job...")
                            tailored_data = ai_agent.tailor_resume(
                                base_resume_text=profile_data["base_resume_text"],
                                job_title=job_title_text,
                                company=company_text,
                                job_description=job_desc_text
                            )
                            
                            # Save tailored resume as PDF
                            tailored_filename = f"Resume_{company_text.replace(' ', '_')}_{job_id}.pdf"
                            tailored_filename = "".join(c for c in tailored_filename if c.isalnum() or c in "._-")
                            tailored_path = os.path.join(config.TAILORED_RESUMES_DIR, tailored_filename)
                            
                            resume_generator.generate_pdf_resume(tailored_data, tailored_path)
                            await self.log(f"Tailored resume PDF generated: {tailored_path}")
                            
                            # --- Step B: Trigger Easy Apply ---
                            easy_apply_btn = self.page.locator("button.jobs-apply-button").first
                            if await easy_apply_btn.count() > 0:
                                btn_text = await easy_apply_btn.inner_text()
                                if "Easy Apply" in btn_text:
                                    await self.human_click(easy_apply_btn)
                                    await self.human_delay(1.5)
                                    
                                    applied = await self.handle_easy_apply_dialog(
                                        job_title=job_title_text,
                                        company=company_text,
                                        job_description=job_desc_text,
                                        profile_data=tailored_data,
                                        tailored_resume_path=tailored_path
                                    )
                                    
                                    if applied:
                                        await self.log(f"Successfully applied to {job_title_text}!")
                                        database.log_application(
                                            job_id=job_id,
                                            title=job_title_text,
                                            company=company_text,
                                            location=loc,
                                            platform="linkedin_easy_apply",
                                            status="applied",
                                            tailored_resume_path=tailored_path
                                        )
                                        self.application_count += 1
                                    else:
                                        await self.log(f"Easy Apply dialog failed for {job_title_text}.")
                                        database.log_application(
                                            job_id=job_id,
                                            title=job_title_text,
                                            company=company_text,
                                            location=loc,
                                            platform="linkedin_easy_apply",
                                            status="failed",
                                            error_message="Easy Apply dialog failed or was aborted"
                                        )
                                else:
                                    await self.log("External redirect apply detected. Redirect automation not fully implemented.")
                            else:
                                await self.log("No apply button found.")
                                
                        except Exception as card_err:
                            await self.log(f"Error processing job card {idx}: {card_err}")
                            traceback.print_exc()
                            
                    await self.human_delay(3.0)
                    
            await self.log("Job search finished.")
            
        except Exception as e:
            await self.log(f"Global execution error: {e}")
            traceback.print_exc()
        finally:
            self.is_running = False
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if hasattr(self, 'playwright'):
                await self.playwright.stop()
            await self.log("Browser session closed.")
            
    async def stop(self):
        self.is_running = False
        await self.log("Stop requested by user. Aborting...")


