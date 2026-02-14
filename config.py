import os
from dotenv import load_dotenv

load_dotenv()

TELEGRAM_TOKEN = os.getenv('TELEGRAM_TOKEN')
ADMIN_CHAT_ID = os.getenv('ADMIN_CHAT_ID')
SPREADSHEET_ID = os.getenv('SPREADSHEET_ID')
CREDENTIALS_FILE = 'credentials.json'

SHEETS = {
    'orders': 'Orders',
    'clients': 'Clients',
    'settings': 'Settings'
}