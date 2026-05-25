import hmac, hashlib, json

payload = b'{"payment_status":"finished","payment_id":1234}'
sig_header = hmac.new(b"secret", json.dumps(json.loads(payload), sort_keys=True, separators=(",", ":")).encode("utf-8"), hashlib.sha512).hexdigest()

print("Payload:", payload)
print("Sig:", sig_header)
