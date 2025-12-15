import os
import logging
from heapq import nlargest
from dotenv import load_dotenv
from hume import AsyncHumeClient
from hume.expression_measurement.batch import Models, Prosody
from hume.expression_measurement.batch.types import InferenceBaseRequest

AUDIO_FILE_PATH = os.path.join(os.path.dirname(__file__), "script_dependencies", "sample.mp3")
REPORT_FILE_PATH = os.path.join(os.path.dirname(__file__), "script_dependencies", "hume_report.txt")

async def main():
    load_dotenv()
    HUME_API_KEY = os.getenv('HUME_API_KEY')

    logging.basicConfig(level=logging.INFO, format='%(module)s [%(asctime)s] %(levelname)s: %(message)s')
    logging.info("logger initialised")

    # get the api key and establish a connection
    client = AsyncHumeClient(api_key=HUME_API_KEY)
    logging.info("AsyncHumeClient object created")

    # configure the model, which will be used
    prosody_config = Prosody()

    models_chosen = Models(prosody=prosody_config)
    stringified_configs = InferenceBaseRequest(models=models_chosen)

    # start an inference job
    with open(AUDIO_FILE_PATH, mode="rb") as f:
        local_filepaths = [f]

        logging.info("starting the inference job...")
        job_id = await client.expression_measurement.batch.start_inference_job_from_local_file(
            json=stringified_configs, file=local_filepaths
        )

    logging.info("waiting for the inference job to complete...")
    # wait for job completion
    while (await client.expression_measurement.batch.get_job_details(job_id)).state.status not in ["COMPLETED", "FAILED"]:
        pass
    logging.info("inference job completed")

    logging.info("getting job predictions and writing a report to hume-report.txt...")
    # print((await client.expression_measurement.batch.get_job_predictions(job_id))[0].results.predictions)
    with open(REPORT_FILE_PATH, mode="w", encoding="utf-8", errors="ignore") as f:
        for utterance in (await client.expression_measurement.batch.get_job_predictions(job_id))[0].results.predictions[0].models.prosody.grouped_predictions[0].predictions:
            top_three_emotions = {}
            for emotion in nlargest(3, utterance.emotions, key = lambda e: e.score):
                top_three_emotions[emotion.name] = round(emotion.score, 1)

            print(utterance.text, file=f)
            print(top_three_emotions, file=f)
            print("\n", file=f)
    logging.info("writing to hume-report.txt completed") 