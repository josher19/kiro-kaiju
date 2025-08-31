stage=${1:-dev}
aws dynamodb create-table \
  --table-name kiro-kaiju-refactor-rampage-${stage} \
  --attribute-definitions \
      AttributeName=userId,AttributeType=S \
      AttributeName=challengeId,AttributeType=S \
  --key-schema \
      AttributeName=userId,KeyType=HASH \
      AttributeName=challengeId,KeyType=RANGE \
  # --endpoint-url http://localhost:8000 \
  # --profile local \
  --billing-mode PAY_PER_REQUEST \
