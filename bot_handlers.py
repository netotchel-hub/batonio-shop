from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes, ConversationHandler
from datetime import datetime

NAME, PHONE, PRODUCT, QUANTITY, COMMENT, CONFIRM = range(6)

class BotHandlers:
    def __init__(self, sheets):
        self.sheets = sheets
    
    async def start(self, update: Update, context):
        user = update.effective_user
        welcome = f"""
🌟 ДОБРО ПОЖАЛОВАТЬ {user.first_name}! 🌟

Это бот магазина {self.sheets.get_setting('shop_name')}

📋 Доступные команды:
/order - Сделать заказ
/catalog - Посмотреть каталог
/help - Помощь
/status - Статус заказа

🕒 Часы работы: {self.sheets.get_setting('working_hours')}
💰 Мин. заказ: {self.sheets.get_setting('min_order_sum')} руб
🚚 Доставка: {self.sheets.get_setting('delivery_price')} руб
        """
        await update.message.reply_text(welcome)
        
        # Сохраняем клиента
        self.sheets.save_client(user.id, user.full_name, '')
    
    async def help(self, update: Update, context):
        help_text = """
🆘 ПОМОЩЬ 🆘

Как сделать заказ:
1️⃣ Нажмите /order
2️⃣ Введите ваше имя
3️⃣ Введите телефон
4️⃣ Введите товар
5️⃣ Введите количество
6️⃣ Добавьте комментарий
7️⃣ Подтвердите заказ

По вопросам: @admin
        """
        await update.message.reply_text(help_text)
    
    async def catalog(self, update: Update, context):
        catalog_text = """
📋 НАШ КАТАЛОГ 📋

1️⃣ Товар 1 - 1000 руб
2️⃣ Товар 2 - 2000 руб
3️⃣ Товар 3 - 3000 руб
4️⃣ Товар 4 - 4000 руб
5️⃣ Товар 5 - 5000 руб

Для заказа используйте /order
        """
        await update.message.reply_text(catalog_text)
    
    async def order_start(self, update: Update, context):
        await update.message.reply_text(
            "🛒 ОФОРМЛЕНИЕ ЗАКАЗА\n\n"
            "Шаг 1 из 7\n"
            "Введите ваше имя:"
        )
        return NAME
    
    async def order_name(self, update: Update, context):
        context.user_data['name'] = update.message.text
        await update.message.reply_text(
            "📱 Шаг 2 из 7\n"
            "Введите номер телефона:\n"
            "Например: +79001234567"
        )
        return PHONE
    
    async def order_phone(self, update: Update, context):
        context.user_data['phone'] = update.message.text
        await update.message.reply_text(
            "📦 Шаг 3 из 7\n"
            "Введите название товара:"
        )
        return PRODUCT
    
    async def order_product(self, update: Update, context):
        context.user_data['product'] = update.message.text
        await update.message.reply_text(
            "🔢 Шаг 4 из 7\n"
            "Введите количество:"
        )
        return QUANTITY
    
    async def order_quantity(self, update: Update, context):
        try:
            qty = int(update.message.text)
            if qty <= 0:
                await update.message.reply_text("❌ Количество должно быть больше 0!")
                return QUANTITY
            
            context.user_data['quantity'] = qty
            # Расчет суммы (пример)
            price = 1000
            context.user_data['amount'] = price * qty
            
            await update.message.reply_text(
                "💬 Шаг 5 из 7\n"
                "Введите комментарий к заказу\n"
                "(или отправьте '-' если нет комментария):"
            )
            return COMMENT
        except ValueError:
            await update.message.reply_text("❌ Введите число!")
            return QUANTITY
    
    async def order_comment(self, update: Update, context):
        comment = update.message.text
        if comment == '-':
            comment = ''
        context.user_data['comment'] = comment
        
        # Показываем подтверждение
        summary = f"""
📋 ПРОВЕРЬТЕ ЗАКАЗ 📋

👤 Имя: {context.user_data['name']}
📱 Телефон: {context.user_data['phone']}
📦 Товар: {context.user_data['product']}
🔢 Количество: {context.user_data['quantity']}
💰 Сумма: {context.user_data['amount']} руб
💬 Комментарий: {context.user_data['comment'] or 'нет'}

✅ Подтверждаете заказ?
        """
        
        keyboard = [
            [InlineKeyboardButton("✅ ДА ПОДТВЕРДИТЬ", callback_data='confirm')],
            [InlineKeyboardButton("❌ НЕТ ОТМЕНИТЬ", callback_data='cancel')]
        ]
        reply = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(summary, reply_markup=reply)
        return CONFIRM
    
    async def order_confirm(self, update: Update, context):
        query = update.callback_query
        await query.answer()
        
        if query.data == 'confirm':
            # Сохраняем заказ
            order_id = self.sheets.save_order(
                update.effective_user.id,
                context.user_data
            )
            
            # Уведомление админу
            await self.notify_admin(context, order_id, context.user_data)
            
            await query.edit_message_text(
                f"✅ ЗАКАЗ ОФОРМЛЕН!\n\n"
                f"Номер заказа: {order_id}\n"
                f"Сумма: {context.user_data['amount']} руб\n\n"
                f"Мы свяжемся с вами в ближайшее время."
            )
        else:
            await query.edit_message_text(
                "❌ ЗАКАЗ ОТМЕНЕН\n\n"
                "Если передумаете используйте /order"
            )
        
        context.user_data.clear()
        return ConversationHandler.END
    
    async def order_cancel(self, update: Update, context):
        await update.message.reply_text(
            "❌ ОФОРМЛЕНИЕ ОТМЕНЕНО\n\n"
            "Используйте /order для нового заказа"
        )
        context.user_data.clear()
        return ConversationHandler.END
    
    async def notify_admin(self, context, order_id, data):
        admin_msg = f"""
🆕 НОВЫЙ ЗАКАЗ #{order_id}

👤 Клиент: {data['name']}
📱 Телефон: {data['phone']}
📦 Товар: {data['product']}
🔢 Количество: {data['quantity']}
💰 Сумма: {data['amount']} руб
💬 Комментарий: {data.get('comment','нет')}

Время: {datetime.now().strftime('%H:%M %d.%m.%Y')}
        """
        
        try:
            from config import ADMIN_CHAT_ID
            await context.bot.send_message(
                chat_id=ADMIN_CHAT_ID,
                text=admin_msg
            )
        except Exception as e:
            print(f"Admin notify error: {e}")
    
    async def status(self, update: Update, context):
        await update.message.reply_text(
            "🔍 ПРОВЕРКА СТАТУСА\n\n"
            "В разработке. Скоро будет доступно!"
        )
    
    async def admin_panel(self, update: Update, context):
        from config import ADMIN_CHAT_ID
        
        if str(update.effective_user.id) != ADMIN_CHAT_ID:
            await update.message.reply_text("⛔ Доступ запрещен!")
            return
        
        keyboard = [
            [InlineKeyboardButton("📊 Статистика сегодня", callback_data='admin_stats')],
            [InlineKeyboardButton("📋 Все заказы", callback_data='admin_orders')],
            [InlineKeyboardButton("⚙️ Настройки", callback_data='admin_settings')],
            [InlineKeyboardButton("👥 Клиенты", callback_data='admin_clients')]
        ]
        reply = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "🔧 АДМИН ПАНЕЛЬ\n\nВыберите действие:",
            reply_markup=reply
        )
    
    async def button_callback(self, update: Update, context):
        query = update.callback_query
        await query.answer()
        
        if query.data == 'admin_stats':
            orders = self.sheets.get_today_orders()
            total = sum(o.get('Сумма',0) for o in orders)
            text = f"""
📊 СТАТИСТИКА ЗА СЕГОДНЯ

📦 Заказов: {len(orders)}
💰 Сумма: {total} руб
            """
            await query.edit_message_text(text)
        
        elif query.data == 'admin_orders':
            orders = self.sheets.get_all_orders()
            if orders:
                text = "📋 ПОСЛЕДНИЕ 5 ЗАКАЗОВ:\n\n"
                for o in orders[-5:]:
                    text += f"#{o.get('ID заказа')} - {o.get('Клиент')} - {o.get('Сумма')} руб ({o.get('Статус')})\n"
            else:
                text = "Заказов нет"
            await query.edit_message_text(text)