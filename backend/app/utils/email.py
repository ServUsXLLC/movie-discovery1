import os
import asyncio
from aiosmtplib import SMTP
from app.config import settings

async def send_email(to: str, subject: str, body: str):
    # If SMTP not configured, print to console
    if not settings.SMTP_HOST:
        print("EMAIL (console) TO:", to)
        print("SUBJECT:", subject)
        print("BODY:", body)
        return

    message = f"From: {settings.EMAIL_FROM}\r\nTo: {to}\r\nSubject: {subject}\r\n\r\n{body}"
    smtp = SMTP(hostname=settings.SMTP_HOST, port=int(settings.SMTP_PORT))
    await smtp.connect()
    await smtp.starttls()
    await smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    await smtp.sendmail(settings.EMAIL_FROM, [to], message)
    await smtp.quit()
