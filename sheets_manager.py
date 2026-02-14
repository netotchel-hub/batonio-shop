import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import uuid
from config import SPREADSHEET_ID, CREDENTIALS_FILE, SHEETS

class SheetsManager:
    def __init__(self):
        self.client = self._connect()
        self.sheet = self.client.open_by_key(SPREADSHEET_ID)
        self._init_sheets()
    
    def _connect(self):
        scope = [
            'https://spreadsheets.google.com/feeds',
            'https://www.googleapis.com/auth/drive'
        ]
        creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scope)
        return gspread.authorize(creds)
    
    def _init_sheets(self):
        # Orders sheet
        try:
            self.orders = self.sheet.worksheet(SHEETS['orders'])
        except:
            self.orders = self.sheet.add_worksheet(SHEETS['orders'], 1000, 20)
            headers = ['Дата','ID заказа','Клиент','Телефон','Товар',
                      'Количество','Сумма','Статус','Комментарий']
            self.orders.append_row(headers)
        
        # Clients sheet
        try:
            self.clients = self.sheet.worksheet(SHEETS['clients'])
        except:
            self.clients = self.sheet.add_worksheet(SHEETS['clients'], 1000, 10)
            headers = ['Дата регистрации','Telegram ID','Имя','Телефон',
                      'Email','Адрес','Статус','Комментарий']
            self.clients.append_row(headers)
        
        # Settings sheet
        try:
            self.settings = self.sheet.worksheet(SHEETS['settings'])
        except:
            self.settings = self.sheet.add_worksheet(SHEETS['settings'], 100, 5)
            headers = ['Параметр','Значение','Описание']
            self.settings.append_row(headers)
            
            default_settings = [
                ['min_order_sum','100','Минимальная сумма заказа'],
                ['delivery_price','300','Стоимость доставки'],
                ['working_hours','9:00-21:00','Часы работы'],
                ['shop_name','Мой Магазин','Название магазина'],
                ['welcome_bonus','50','Бонус за регистрацию']
            ]
            for setting in default_settings:
                self.settings.append_row(setting)
    
    def save_order(self, user_id, data):
        order_id = str(uuid.uuid4())[:6].upper()
        row = [
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            f'ORD{order_id}',
            data.get('name',''),
            data.get('phone',''),
            data.get('product',''),
            str(data.get('quantity',1)),
            str(data.get('amount',0)),
            'Новый',
            data.get('comment','')
        ]
        self.orders.append_row(row)
        return f'ORD{order_id}'
    
    def save_client(self, telegram_id, name, phone):
        # Проверяем существует ли клиент
        try:
            clients = self.clients.get_all_records()
            for client in clients:
                if str(client.get('Telegram ID')) == str(telegram_id):
                    return False
        except:
            pass
        
        row = [
            datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            str(telegram_id),
            name,
            phone,
            '',
            '',
            'Активен',
            'Новый клиент'
        ]
        self.clients.append_row(row)
        return True
    
    def get_setting(self, key):
        try:
            settings = self.settings.get_all_records()
            for setting in settings:
                if setting.get('Параметр') == key:
                    return setting.get('Значение')
        except:
            pass
        return None
    
    def get_today_orders(self):
        try:
            orders = self.orders.get_all_records()
            today = datetime.now().strftime('%Y-%m-%d')
            return [o for o in orders if today in o.get('Дата','')]
        except:
            return []
    
    def get_all_orders(self):
        try:
            return self.orders.get_all_records()
        except:
            return []