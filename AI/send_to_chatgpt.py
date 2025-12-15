import openai
import os
import logging
from dotenv import load_dotenv

DEEPGRAM_REPORT_FILE_PATH = os.path.join(os.path.dirname(__file__), "script_dependencies", "deepgram_transcription.txt")
HUME_REPORT_FILE_PATH = os.path.join(os.path.dirname(__file__), "script_dependencies", "hume_report.txt")
REPORT_FILE_PATH = os.path.join(os.path.dirname(__file__), "script_dependencies", "chatgpt_report.txt")

def main():
	load_dotenv()
	CHATGPT_API_KEY = os.getenv('CHATGPT_API_KEY')

	logging.basicConfig(level=logging.INFO, format='%(module)s [%(asctime)s] %(levelname)s: %(message)s')
	logging.info("logger initialised")

	client = openai.OpenAI(api_key=CHATGPT_API_KEY)
	logging.info("OpenAI object created")

	logging.info("reading the text files...")
	with open(DEEPGRAM_REPORT_FILE_PATH, "r", encoding="utf-8") as file:
		transcription = file.read()
	logging.info("deepgram-transcription.txt read...")

	with open(HUME_REPORT_FILE_PATH, "r", encoding="utf-8") as file:
		emotional_analysis = file.read()
	logging.info("hume-report.txt read...")

	prompt = f"""
	You are an AI assistant helping a psychology facilitator during a live online session. Your task is to analyze a conversation transcription between the facilitator and a client. You are given two versions of the transcript:

	- Primary transcript: A transcription of the conversation with minimal mistakes.
	- Annotated transcript: The same conversation but with more transcription errors, along with emotion scores (0 to 1) for each utterance, where 1 represents the strongest emotion(may also contain errors).

	Your goal is to provide real-time guidance to the facilitator to improve their responses and approach.

	Your output should be:
	: Brief and actionable advice on how the facilitator should continue the conversation in a supportive and effective manner.
	: Comments on the situation, if necessary, highlighting key emotional cues, potential hidden emotions, or concerns.
	: Concise format to ensure the facilitator can read and implement your feedback instantly.

	Please ensure that each of the following topics (Next Steps, Emotional Cues, Concerns, Tone Sensitivity) contains only one clear and short comment to keep the response easily readable and actionable for the facilitator.

	Guidelines:
	# Prioritize clarity and speed of understanding. Keep responses short and direct.
	# If the client shows distress, hesitation, or hidden emotions, suggest ways for the facilitator to respond with empathy.
	# Use emotion scores to detect any mismatch between words and feelings (e.g., if a client says "I'm fine" but has a high sadness score).
	# If necessary, warn the facilitator about sensitive topics or shifts in tone.
	# In the report, use only UTF-8 characters.

	Structure of your response should be as follows:
	<h3>Next Steps</h3>
    <ul>
        <li>step</li>
    </ul>

	<h3>Emotional Cues</h3>
    <ul>
        <li>cue</li>
    </ul>

	<h3>Concerns</h3>
    <ul>
        <li>concern</li>
    </ul>

	<h3>Tone Sensitivity</h3>
    <ul>
        <li>sensitivity</li>
    </ul>

	PRIMARY TRANSCRIPT:
	{transcription}

	ANNOTATED TRANSCRIPT:
	{emotional_analysis}
	"""

	logging.info("sending a request to ChatGPT...")
	response = client.responses.create(
		model="gpt-4o",
		input=prompt,
		temperature=0.4
	)

	with open(REPORT_FILE_PATH, mode="w", encoding="utf-8", errors="ignore") as f:
		print(response.output_text, file=f)