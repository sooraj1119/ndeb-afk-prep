import yt_dlp
import random
import re
import imageio_ffmpeg

def get_latest_fifa_video(num_videos=1, history=None):
    if history is None:
        history = []
        
    players = ["Cristiano Ronaldo", "Lionel Messi", "Neymar", "Kylian Mbappe", "Erling Haaland", "Mohamed Salah", "Jude Bellingham", "Vinicius Jr", "Lamine Yamal", "Phil Foden", "Diego Maradona", "Zinedine Zidane", "Ronaldinho", "David Beckham"]
    short_players_list = ["Ronaldo", "Messi", "Neymar", "Mbappe", "Haaland", "Salah", "Bellingham", "Vinicius", "Yamal", "Foden", "Maradona", "Zidane", "Ronaldinho", "Beckham"]

    ydl_opts = {
        'extract_flat': True,
        'quiet': True,
        'no_warnings': True,
    }

    found_videos = []
    
    banned_words_pattern = re.compile(r'\b(interview|podcast|bench|funny|drama|fight|wife|girlfriend|reaction|fans|training|crying|sad|drugs|arrest|police|fifa|fc 24|fc24|eafc|ea sports|efootball|pes|gameplay|mod|career mode|ultimate team|xbox|playstation|ps5|coach|manager|award|ceremony|speech|press|conference|trophy|celebration|red carpet|ballon dor|gala|best player|puskas|documentary|trailer|movie|film|teaser|promo|commercial|ad|pepsi|nike|adidas|puma|sponsor|behind the scenes|vlog)\b')
    action_pattern = re.compile(r'\b(goal|goals|assist|assists|pass|passes|passing|freekick|free kick|dribble|dribbles|dribbling|skill|skills|magic|destroy|destroys|humiliate|humiliates|hattrick|hat-trick|brace|match|highlights|vs|tackle|tackles|volley|solo|nutmeg|nutmegs|panenka|bicycle kick|header|save|saves|masterclass|play|plays|run)\b')

    while len(found_videos) < num_videos:
        selected_player = random.choice(players)
        
        queries = [
            f"{selected_player} goals 2024 #shorts",
            f"{selected_player} skills 2024 #shorts",
            f"{selected_player} highlights 2024 #shorts",
            f"{selected_player} best goals 2024 #shorts"
        ]
        
        random_query = random.choice(queries)
        search_query = f"ytsearch1000:{random_query}"
        
        print(f"Using search query: {random_query}")

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                result = ydl.extract_info(search_query, download=False)
                if 'entries' in result:
                    for entry in result['entries']:
                        video_id = entry.get('id')
                        duration = entry.get('duration', 0)
                        title_lower = entry.get('title', '').lower()
                        
                        is_banned = bool(banned_words_pattern.search(title_lower))
                        has_action = bool(action_pattern.search(title_lower))
                        is_pure_gameplay = (not is_banned) and has_action

                        if video_id not in history and duration and 0 < duration <= 61 and is_pure_gameplay:
                            query_player = "Football"
                            for short_name in short_players_list:
                                if short_name.lower() in random_query.lower():
                                    query_player = short_name
                                    break
                                    
                            found_videos.append({
                                'id': video_id,
                                'url': f"https://www.youtube.com/watch?v={video_id}",
                                'title': entry.get('title'),
                                'query_player': query_player
                            })
                            history.append(video_id)
                            
                            if len(found_videos) >= num_videos:
                                break
            except Exception as e:
                print(f"Error during search: {e}")

    return found_videos

def download_video(url, output_path):
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': output_path,
        'merge_output_format': 'mp4',
        'ffmpeg_location': imageio_ffmpeg.get_ffmpeg_exe(),
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])
