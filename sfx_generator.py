import numpy as np
import scipy.io.wavfile as wav
import os

def generate_boing_sfx(output_path="temp_assets/boing.wav"):
    """
    Synthesizes a cartoon 'Boing!' sound using pure numpy math.
    This creates a fast upward frequency sweep with an exponential decay envelope.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    sample_rate = 44100
    duration = 0.4  # 400ms boing
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    
    # Frequency sweeps rapidly from low to high (e.g., 150Hz to 600Hz)
    start_freq = 150.0
    end_freq = 600.0
    
    # Non-linear sweep for that rubbery "boing" feel
    freqs = start_freq + (end_freq - start_freq) * (1 - np.exp(-t * 10))
    
    # Integrate frequency to get phase
    phase = np.cumsum(freqs) / sample_rate * 2 * np.pi
    
    # Generate the sine wave
    wave = np.sin(phase)
    
    # Add some harmonics for a richer cartoon sound
    wave += 0.5 * np.sin(phase * 2)
    wave += 0.25 * np.sin(phase * 3)
    
    # Amplitude envelope: Instant attack, exponential decay
    envelope = np.exp(-t * 12)
    
    # Apply envelope
    audio = wave * envelope
    
    # Normalize to 16-bit PCM range
    audio_normalized = np.int16((audio / np.max(np.abs(audio))) * 32767)
    
    # Save as WAV
    wav.write(output_path, sample_rate, audio_normalized)
    print(f"Generated Boing SFX at: {output_path}")
    return output_path

if __name__ == "__main__":
    generate_boing_sfx("temp_assets/boing.wav")
