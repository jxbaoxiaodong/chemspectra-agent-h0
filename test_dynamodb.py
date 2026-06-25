"""DynamoDB 连通性测试"""
import os, boto3, uuid
from datetime import datetime, timezone

# 读取 .env
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

dynamodb = boto3.resource("dynamodb",
    region_name=os.environ.get("AWS_REGION", "us-east-2"),
    aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"))

table = dynamodb.Table("chemspectra-sessions")
print("✅ 表状态:", table.table_status)

test_id = uuid.uuid4().hex[:12]
table.put_item(Item={
    "session_id": test_id,
    "step": "test",
    "created_at": datetime.now(timezone.utc).isoformat(),
    "ttl": int(datetime.now(timezone.utc).timestamp()) + 86400,
})
resp = table.get_item(Key={"session_id": test_id})
print(f"✅ 读写通过: {resp['Item']['session_id']}")
table.delete_item(Key={"session_id": test_id})
print("✅ 全部 OK — DynamoDB 就绪")
