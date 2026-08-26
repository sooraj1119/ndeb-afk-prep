import os
import google_auth_oauthlib.flow
import googleapiclient.discovery
import googleapiclient.errors
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.force-ssl"
]
CLIENT_SECRETS_FILE = "client_secrets.json"
CREDENTIALS_FILE = "credentials.json"

def get_authenticated_service():
    creds = None
    if os.path.exists(CREDENTIALS_FILE):
        creds = Credentials.from_authorized_user_file(CREDENTIALS_FILE, SCOPES)
        
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT_SECRETS_FILE):
                raise FileNotFoundError(f"Missing {CLIENT_SECRETS_FILE}. Please download it from Google Cloud Console.")
                
            flow = google_auth_oauthlib.flow.InstalledAppFlow.from_client_secrets_file(
                CLIENT_SECRETS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
            
        with open(CREDENTIALS_FILE, 'w') as token:
            token.write(creds.to_json())
            
    return googleapiclient.discovery.build("youtube", "v3", credentials=creds)

def upload_video(file_path, title, description, tags, privacy_status="private"):
    """
    Uploads a video to YouTube. 
    privacy_status can be 'public', 'private', or 'unlisted'.
    """
    try:
        youtube = get_authenticated_service()
    except Exception as e:
        print(f"Authentication Error: {e}")
        return False
        
    request_body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": "17" # Sports
        },
        "status": {
            "privacyStatus": privacy_status,
            "selfDeclaredMadeForKids": False
        }
    }
    
    media_file = MediaFileUpload(file_path, chunksize=-1, resumable=True)
    
    request = youtube.videos().insert(
        part="snippet,status",
        body=request_body,
        media_body=media_file
    )
    
    print(f"Uploading {file_path} to YouTube as '{privacy_status}'...")
    response = None
    try:
        while response is None:
            status, response = request.next_chunk()
            if status:
                print(f"Uploaded {int(status.progress() * 100)}%")
    except googleapiclient.errors.HttpError as e:
        print(f"YouTube API Error (Quota exceeded or invalid request): {e}")
        return False
    except Exception as e:
        print(f"Unexpected Upload Error: {e}")
        return False
            
    print(f"Upload Complete! Video ID: {response['id']}")
    return response['id']

def post_creator_comment(video_id, text):
    """
    Posts a top-level comment on a video.
    """
    try:
        youtube = get_authenticated_service()
    except Exception as e:
        print(f"Auth Error for commenting: {e}")
        return False
        
    try:
        request = youtube.commentThreads().insert(
            part="snippet",
            body={
                "snippet": {
                    "videoId": video_id,
                    "topLevelComment": {
                        "snippet": {
                            "textOriginal": text
                        }
                    }
                }
            }
        )
        response = request.execute()
        print(f"Successfully posted comment: '{text}'")
        return True
    except Exception as e:
        print(f"Failed to post comment: {e}")
        return False
