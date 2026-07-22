import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print("Configured API Key:", api_key)

try:
    print("Configuring Generative AI...")
    genai.configure(api_key=api_key)
    print("Initializing model...")
    model = genai.GenerativeModel("gemini-3.5-flash")
    print("Sending test prompt...")
    response = model.generate_content("Hello, write the word 'Vanakkam' in Tamil.")
    print("Response received successfully:")
    print(response.text)
except Exception as e:
    print("An error occurred during verification:")
    print(e)
