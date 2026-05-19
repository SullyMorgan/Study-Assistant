import json
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
      contents=prompt
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
      contents=prompt,
      config={
        "response_mime_type": "application/json",
        "response_schema": {
          "type": "OBJECT",
          "properties": {
            "questions": {
              "type": "ARRAY",
              "items": {
                "type": "OBJECT",
                "properties": {
                  "question_text": {"type": "STRING"},
                  "options": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                  },
                  "correct_option_index": {
                    "type": "INTEGER",
                    "description": "0-based index of the correct answer in the options array"
                  },
                  "explanation": {"type": "STRING"}
                },
                "required": ["question_text", "options", "correct_option_index", "explanation"]
              }
            }
          },
          "required": ["questions"]
        }
      }
    )

    return json.loads(response.text)
  except Exception as e:
    return {"error": f"Error generating quiz: {str(e)}", "questions": []}
