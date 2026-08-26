import os
import requests
from dotenv import load_dotenv

load_dotenv()

PAGE_ID = os.getenv("FACEBOOK_PAGE_ID")
ACCESS_TOKEN = os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN")
API_VERSION = "v19.0"

def upload_to_facebook_reels(video_path, title, description):
    """
    Uploads an MP4 file to Facebook Reels using the Graph API 3-step process.
    """
    if not PAGE_ID or not ACCESS_TOKEN:
        print("Facebook credentials missing in .env file. Skipping Facebook upload.")
        return False
        
    print(f"\n--- Starting Facebook Reels Upload ---")
    print(f"Video: {video_path}")
    
    try:
        # 1. Initialize Upload Phase
        print("1. Initializing upload session with Meta servers...")
        init_url = f"https://graph.facebook.com/{API_VERSION}/{PAGE_ID}/video_reels"
        init_payload = {
            "upload_phase": "start",
            "access_token": ACCESS_TOKEN
        }
        init_response = requests.post(init_url, data=init_payload).json()
        
        if "video_id" not in init_response:
            print(f"FAILED to initialize upload: {init_response}")
            return False
            
        video_id = init_response["video_id"]
        upload_url = init_response["upload_url"]
        
        # 2. Upload Phase
        print(f"2. Streaming video payload (ID: {video_id})...")
        headers = {
            "Authorization": f"OAuth {ACCESS_TOKEN}",
            "offset": "0",
            "file_size": str(os.path.getsize(video_path))
        }
        with open(video_path, "rb") as f:
            upload_response = requests.post(upload_url, headers=headers, data=f).json()
            
        if "success" not in upload_response or not upload_response["success"]:
            print(f"FAILED to stream video bytes: {upload_response}")
            return False
            
        # 3. Publish Phase
        print("3. Command Meta to publish the Reel...")
        # Add popular football hashtags to the description to boost algorithm reach
        full_description = f"{title}\n\n{description}\n\n#football #soccer #fifa #highlights #viral #respect"
        
        publish_url = f"https://graph.facebook.com/{API_VERSION}/{PAGE_ID}/video_reels"
        publish_payload = {
            "upload_phase": "finish",
            "video_id": video_id,
            "video_state": "PUBLISHED",
            "description": full_description,
            "access_token": ACCESS_TOKEN
        }
        publish_response = requests.post(publish_url, data=publish_payload).json()
        
        if "success" in publish_response and publish_response["success"]:
            print("SUCCESS! Facebook Reel is now live on your Page.")
            return True
        else:
            print(f"FAILED to publish reel: {publish_response}")
            return False
            
    except Exception as e:
        print(f"Facebook API Error: {str(e)}")
        return False

if __name__ == "__main__":
    # Test the script if run directly
    if os.path.exists("test_splitscreen2.mp4"):
        upload_to_facebook_reels(
            "test_splitscreen2.mp4", 
            "Is this the greatest play of the tournament? 🤯", 
            "Watch this unbelievable football highlight!"
        )
    else:
        print("test_splitscreen2.mp4 not found to test with.")
