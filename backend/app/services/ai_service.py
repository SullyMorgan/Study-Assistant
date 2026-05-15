import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = "models/gemini-2.5-flash"

def generate_summary(text: str):
  prompt = f"""
  Summarize the following text, strictly in the language of the text, in bullet point, focus on the key concepts and important details.
  STRICT RULES:
  1. Answer strictly in the language of the text.
  2. DO NOT include any introductory or concluding sentences, like "Here is the summary" or "Sure, I can help".
  3. Start directly with the first bullet point
  The text: {text}
  """

  try:
    response = client.models.generate_content(
      model=MODEL_NAME,
      contents=f"Summarize the following text, strictly in the language of the text, in bullet point, focus on the key concepts and important details: {text}"
    )
    return response.text
  except Exception as e:
    return f"Error generating summary: {e}"

def generate_quiz(text: str):
  prompt = f"""
  Generate a quiz based on the following text, strictly in the language of the text.
  The quiz should consist of 5 multiple choice questions, each with 4 options and only one correct answer.
  Give a short explanation for the correct answer.

  STRICT RULES:
  1. Answer strictly in the language of the text.
  2. DO NOT include any introductory or concluding sentences, like "Here is the quiz" or "Sure, I can help".
  3. Start directly with the first question.

  The text: {text}
  """

  try:
    response = client.models.generate_content(
      model=MODEL_NAME,
      contents=prompt
    )
    return response.text
  except Exception as e:
    return f"Error generating quiz: {e}"
