import os
from dotenv import load_dotenv
from deepgram import *
import logging

AUDIO_FILE_PATH = os.path.join(os.path.dirname(__file__), "script_dependencies", "sample.mp3")
REPORT_FILE_PATH = os.path.join(os.path.dirname(__file__), "script_dependencies", "deepgram_transcription.txt")

def main():
    load_dotenv()
    DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')

    # get the api key and establish a connection
    logging.basicConfig(level=logging.INFO, format='%(module)s [%(asctime)s] %(levelname)s: %(message)s')
    logging.info("logger initialised")
    deepgram: DeepgramClient = DeepgramClient(DEEPGRAM_API_KEY)
    logging.info("DeepgramClient object created")

    # define the filepaths of the files to analyze
    logging.info("getting the file...")
    with open(AUDIO_FILE_PATH, "rb") as file:
                buffer_data = file.read()
    file.close()

    #build a request that will be sent to Deepgram API
    logging.info("constructing the request arguments...")
    payload: FileSource = {
        "buffer": buffer_data,
    }

    options: PrerecordedOptions = PrerecordedOptions(
        model="nova-3",
        smart_format=True,
        punctuate=True,
        diarize=True,
        filler_words=True
    )

    #send the request
    logging.info("sending the request...")
    response = deepgram.listen.rest.v("1").transcribe_file(payload, options)
    logging.info("response acquired...")
    #get the results
    transcript = response['results']['channels'][0]['alternatives'][0]['paragraphs']['transcript']
    #print the results to the file
    logging.info("writing the transcript to deepgram-transcription.txt...")
    with open(REPORT_FILE_PATH, mode="w", encoding="utf-8", errors="ignore") as f:
            print(transcript, file=f)