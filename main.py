#!/usr/bin/env python
import logging
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ConversationHandler,
    filters
)
from config import TELEGRAM_TOKEN
from sheets_manager import SheetsManager
from bot_handlers import BotHandlers, NAME, PHONE, PRODUCT, QUANTITY, COMMENT, CONFIRM

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

def main():
    # Инициализация
    sheets = SheetsManager()
    handlers = BotHandlers(sheets)
    
    # Создание приложения
    app = Application.builder().token(TELEGRAM_TOKEN).build()
    
    # ConversationHandler для заказов
    order_handler = ConversationHandler(
        entry_points=[CommandHandler('order', handlers.order_start)],
        states={
            NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.order_name)],
            PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.order_phone)],
            PRODUCT: [MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.order_product)],
            QUANTITY: [MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.order_quantity)],
            COMMENT: [MessageHandler(filters.TEXT & ~filters.COMMAND, handlers.order_comment)],
            CONFIRM: [CallbackQueryHandler(handlers.order_confirm)]
        },
        fallbacks=[CommandHandler('cancel', handlers.order_cancel)]
    )
    
    # Регистрация обработчиков
    app.add_handler(CommandHandler('start', handlers.start))
    app.add_handler(CommandHandler('help', handlers.help))
    app.add_handler(CommandHandler('catalog', handlers.catalog))
    app.add_handler(CommandHandler('status', handlers.status))
    app.add_handler(CommandHandler('admin', handlers.admin_panel))
    app.add_handler(order_handler)
    app.add_handler(CallbackQueryHandler(handlers.button_callback))
    
    # Запуск
    print('🤖 БОТ ЗАПУЩЕН...')
    print('📝 Нажмите Ctrl+C для остановки')
    app.run_polling()

if __name__ == '__main__':
    main()