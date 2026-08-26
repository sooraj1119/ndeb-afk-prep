import requests
import sys

APP_ID = "1707054533963522"
APP_SECRET = "b85fcb9f6560bef9dfe17372a371fd07"
PAGE_ID = "1237278262791878"

if len(sys.argv) < 2:
    print("Usage: python get_long_lived_token.py <SHORT_LIVED_USER_TOKEN>")
    sys.exit(1)

short_lived_user_token = sys.argv[1]

print("1. Exchanging Short-Lived User Token for Long-Lived User Token...")
url1 = f"https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={short_lived_user_token}"
res1 = requests.get(url1).json()

if 'access_token' not in res1:
    print(f"Error getting long-lived user token: {res1}")
    sys.exit(1)

long_lived_user_token = res1['access_token']
print("Success! Got Long-Lived User Token.")

print("2. Exchanging Long-Lived User Token for Permanent Page Token...")
url2 = f"https://graph.facebook.com/v19.0/{PAGE_ID}?fields=access_token&access_token={long_lived_user_token}"
res2 = requests.get(url2).json()

if 'access_token' not in res2:
    print(f"Error getting permanent page token: {res2}")
    sys.exit(1)

permanent_page_token = res2['access_token']
print("\n========================================")
print("SUCCESS! HERE IS YOUR PERMANENT PAGE TOKEN:")
print(permanent_page_token)
print("========================================\n")
print("Copy this value into your .env file as FACEBOOK_PAGE_ACCESS_TOKEN!")
