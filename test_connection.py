import gspread
from google.oauth2.service_account import Credentials

# Настройка доступа
scope = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# Загрузка credentials
credentials = Credentials.from_service_account_file(
    'credentials.json',  # путь к вашему файлу
    scopes=scope
)

# Авторизация
client = gspread.authorize(credentials)

# Открываем таблицу по ID (замените на ваш ID)
spreadsheet_id = '1ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'  # ВАШ ID ТАБЛИЦЫ
sheet = client.open_by_key(spreadsheet_id)

# Проверяем доступ к листам
print("✅ Успешное подключение к Google Sheets!")
print(f"📊 Название таблицы: {sheet.title}")
print(f"📋 Доступные листы:")

for worksheet in sheet.worksheets():
    print(f"   - {worksheet.title}")
    
# Пробуем записать тестовые данные
test_sheet = sheet.worksheet('Settings')
test_sheet.update('A1', 'Параметр')  # Обновим заголовок для проверки
print("✅ Запись в таблицу работает!")