import resend
try:
    params = {
        "from": "test@test.com",
        "to": ["test@test.com"],
        "subject": "hi",
        "html": "<strong>hello</strong>",
        "attachments": [
            {"filename": "test.txt", "content": list(b"hello world"), "content_type": "text/plain"}
        ],
    }
    resend.api_key = "re_123456789"
    resend.Emails.send(params)
except Exception as e:
    print("ERROR:", str(e))
