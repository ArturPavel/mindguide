import asyncio
import os
import threading
import logging
import send_to_deepgram
import send_to_hume
import send_to_chatgpt

logging.basicConfig(level=logging.INFO, format='%(module)s [%(asctime)s] %(levelname)s: %(message)s')
logging.info("logger initialised")

#create three separate threads for Deepgram and Hume to run simultaneously and to know when ChatGPT finishes analyzing
logging.info("creating separate threads for Deepgram, Hume and ChatGPT...")
deepgram_thread = threading.Thread(target=send_to_deepgram.main)
hume_thread = threading.Thread(target=lambda: asyncio.run(send_to_hume.main()))
chatgpt_thread = threading.Thread(target=send_to_chatgpt.main)

logging.info("starting Deepgram analysis...")
deepgram_thread.start()
logging.info("starting Hume analysis...")
hume_thread.start()
logging.info("waiting for Deepgram and Hume to finish...")
deepgram_thread.join()
hume_thread.join()
logging.info("deleting sample.mp3...")
os.remove(os.path.join(os.path.dirname(__file__), "script_dependencies", "sample.mp3"))
logging.info("starting ChatGPT analysis...")
chatgpt_thread.start()
logging.info("waiting for ChatGPT to finish...")
chatgpt_thread.join()

logging.info("process ended.")
