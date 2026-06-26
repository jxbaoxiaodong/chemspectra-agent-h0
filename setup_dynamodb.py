"""一键创建 DynamoDB 表 + GSI + Stats 表。

运行方式:
    source .env && python setup_dynamodb.py

功能:
    1. chemspectra-sessions 表 — 带两个 GSI + TTL
       - GSI gsi-created: pk_all(HASH) + created_at(RANGE) → 按时间查询历史
       - GSI gsi-material: top_match(HASH) + created_at(RANGE) → 按材料聚合查询
    2. chemspectra-stats 表 — 原子计数器（使用量统计）
"""

import os
import sys
import time

import boto3
from botocore.exceptions import ClientError

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

REGION = os.environ.get("AWS_REGION", "us-east-2")
SESSION_TABLE = os.environ.get("DYNAMODB_TABLE", "chemspectra-sessions")
STATS_TABLE = os.environ.get("DYNAMODB_STATS_TABLE", "chemspectra-stats")

dynamodb = boto3.client("dynamodb", region_name=REGION)


def wait_for_table(table_name: str) -> None:
    waiter = dynamodb.get_waiter("table_exists")
    waiter.wait(TableName=table_name, WaiterConfig={"Delay": 2, "MaxAttempts": 30})


def _wait_for_gsi_active(gsi_name: str, max_wait: int = 600) -> None:
    """等待 GSI 状态变为 ACTIVE。"""
    elapsed = 0
    while elapsed < max_wait:
        info = dynamodb.describe_table(TableName=SESSION_TABLE)
        for gsi in info["Table"].get("GlobalSecondaryIndexes", []):
            if gsi["IndexName"] == gsi_name and gsi["IndexStatus"] == "ACTIVE":
                return
        time.sleep(5)
        elapsed += 5
        print(f"  ... 等待中 ({elapsed}s)")
    raise TimeoutError(f"GSI {gsi_name} 未在 {max_wait}s 内变为 ACTIVE")


def create_sessions_table() -> None:
    try:
        info = dynamodb.describe_table(TableName=SESSION_TABLE)
        print(f"✅ 表 {SESSION_TABLE} 已存在 (状态: {info['Table']['TableStatus']})")
        _ensure_gsis()
        _ensure_ttl()
        return
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceNotFoundException":
            raise

    print(f"创建表 {SESSION_TABLE} ...")
    dynamodb.create_table(
        TableName=SESSION_TABLE,
        KeySchema=[{"AttributeName": "session_id", "KeyType": "HASH"}],
        AttributeDefinitions=[
            {"AttributeName": "session_id", "AttributeType": "S"},
            {"AttributeName": "pk_all", "AttributeType": "S"},
            {"AttributeName": "created_at", "AttributeType": "S"},
            {"AttributeName": "top_match", "AttributeType": "S"},
        ],
        GlobalSecondaryIndexes=[
            {
                "IndexName": "gsi-created",
                "KeySchema": [
                    {"AttributeName": "pk_all", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
            {
                "IndexName": "gsi-material",
                "KeySchema": [
                    {"AttributeName": "top_match", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            },
        ],
        BillingMode="PAY_PER_REQUEST",
    )
    wait_for_table(SESSION_TABLE)
    print(f"✅ 表 {SESSION_TABLE} 创建完成")

    _ensure_ttl()


def _ensure_gsis() -> None:
    info = dynamodb.describe_table(TableName=SESSION_TABLE)
    existing = {g["IndexName"] for g in info["Table"].get("GlobalSecondaryIndexes", [])}

    to_create = []
    if "gsi-created" not in existing:
        to_create.append({
            "Create": {
                "IndexName": "gsi-created",
                "KeySchema": [
                    {"AttributeName": "pk_all", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        })
    if "gsi-material" not in existing:
        to_create.append({
            "Create": {
                "IndexName": "gsi-material",
                "KeySchema": [
                    {"AttributeName": "top_match", "KeyType": "HASH"},
                    {"AttributeName": "created_at", "KeyType": "RANGE"},
                ],
                "Projection": {"ProjectionType": "ALL"},
            }
        })

    if not to_create:
        print("✅ GSI gsi-created + gsi-material 已存在")
        return

    attrs = [
        {"AttributeName": "pk_all", "AttributeType": "S"},
        {"AttributeName": "created_at", "AttributeType": "S"},
        {"AttributeName": "top_match", "AttributeType": "S"},
    ]

    for gsi_update in to_create:
        gsi_name = gsi_update["Create"]["IndexName"]
        print(f"添加 GSI: {gsi_name} ...")
        dynamodb.update_table(
            TableName=SESSION_TABLE,
            AttributeDefinitions=attrs,
            GlobalSecondaryIndexUpdates=[gsi_update],
        )
        print(f"等待 {gsi_name} 创建 ...")
        _wait_for_gsi_active(gsi_name)
        print(f"✅ {gsi_name} 创建完成")


def _ensure_ttl() -> None:
    try:
        desc = dynamodb.describe_time_to_live(TableName=SESSION_TABLE)
        status = desc["TimeToLiveDescription"]["TimeToLiveStatus"]
        if status in ("ENABLED", "ENABLING"):
            print("✅ TTL 已启用")
            return
    except Exception:
        pass

    try:
        dynamodb.update_time_to_live(
            TableName=SESSION_TABLE,
            TimeToLiveSpecification={"Enabled": True, "AttributeName": "ttl"},
        )
        print("✅ TTL 已启用 (属性: ttl)")
    except ClientError as e:
        if "already exists" in str(e).lower():
            print("✅ TTL 已启用")
        else:
            print(f"⚠️ TTL 设置失败: {e}")


def create_stats_table() -> None:
    try:
        info = dynamodb.describe_table(TableName=STATS_TABLE)
        print(f"✅ 表 {STATS_TABLE} 已存在 (状态: {info['Table']['TableStatus']})")
        return
    except ClientError as e:
        if e.response["Error"]["Code"] != "ResourceNotFoundException":
            raise

    print(f"创建表 {STATS_TABLE} ...")
    dynamodb.create_table(
        TableName=STATS_TABLE,
        KeySchema=[{"AttributeName": "stat_id", "KeyType": "HASH"}],
        AttributeDefinitions=[{"AttributeName": "stat_id", "AttributeType": "S"}],
        BillingMode="PAY_PER_REQUEST",
    )
    wait_for_table(STATS_TABLE)

    resource = boto3.resource("dynamodb", region_name=REGION)
    resource.Table(STATS_TABLE).put_item(Item={
        "stat_id": "global",
        "total_analyses": 0,
        "total_tools_called": 0,
    })
    print(f"✅ 表 {STATS_TABLE} 创建完成，初始计数器已设置")


if __name__ == "__main__":
    print(f"Region: {REGION}")
    print(f"Session 表: {SESSION_TABLE}")
    print(f"Stats 表: {STATS_TABLE}")
    print("=" * 50)
    create_sessions_table()
    create_stats_table()
    print("=" * 50)
    print("✅ 全部完成")
