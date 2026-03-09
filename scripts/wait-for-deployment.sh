#!/bin/bash

set -e

COMMAND_ID="$1"
INSTANCE_ID="$2"
EC2_REGION="${EC2_REGION:-ap-northeast-2}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

if [ -z "$COMMAND_ID" ] || [ -z "$INSTANCE_ID" ]; then
    error "Usage: $0 <COMMAND_ID> <INSTANCE_ID>"
    exit 1
fi

log "Monitoring SSM deployment command"
log "Command ID: $COMMAND_ID"
log "Instance ID: $INSTANCE_ID"

MAX_WAIT_TIME=1800
WAIT_INTERVAL=15
ELAPSED_TIME=0
LAST_OUTPUT_CHECK=0

while [ $ELAPSED_TIME -lt $MAX_WAIT_TIME ]; do
    STATUS=$(aws ssm get-command-invocation \
        --region "$EC2_REGION" \
        --command-id "$COMMAND_ID" \
        --instance-id "$INSTANCE_ID" \
        --query 'Status' \
        --output text 2>/dev/null || echo "Unknown")

    case "$STATUS" in
        "Success")
            success "Deployment completed successfully!"
            echo ""
            echo "=== Deployment log ==="
            aws ssm get-command-invocation \
                --region "$EC2_REGION" \
                --command-id "$COMMAND_ID" \
                --instance-id "$INSTANCE_ID" \
                --query 'StandardOutputContent' \
                --output text 2>/dev/null | tail -30
            echo ""
            success "https://search.git-tree.com"
            exit 0
            ;;
        "Failed")
            error "Deployment failed!"
            echo ""
            echo "=== Error log ==="
            aws ssm get-command-invocation \
                --region "$EC2_REGION" \
                --command-id "$COMMAND_ID" \
                --instance-id "$INSTANCE_ID" \
                --query 'StandardErrorContent' \
                --output text 2>/dev/null | tail -50
            echo ""
            echo "=== Standard output (last 50 lines) ==="
            aws ssm get-command-invocation \
                --region "$EC2_REGION" \
                --command-id "$COMMAND_ID" \
                --instance-id "$INSTANCE_ID" \
                --query 'StandardOutputContent' \
                --output text 2>/dev/null | tail -50
            exit 1
            ;;
        "InProgress")
            minutes=$((ELAPSED_TIME / 60))
            seconds=$((ELAPSED_TIME % 60))
            log "Deploying... (${minutes}m ${seconds}s)"
            if [ $((ELAPSED_TIME - LAST_OUTPUT_CHECK)) -ge 60 ]; then
                echo ""
                echo "=== Progress (last 15 lines) ==="
                aws ssm get-command-invocation \
                    --region "$EC2_REGION" \
                    --command-id "$COMMAND_ID" \
                    --instance-id "$INSTANCE_ID" \
                    --query 'StandardOutputContent' \
                    --output text 2>/dev/null | tail -15 | sed 's/^/  /' || true
                echo ""
                LAST_OUTPUT_CHECK=$ELAPSED_TIME
            fi
            ;;
        "Cancelled"|"TimedOut")
            error "Deployment $STATUS"
            exit 1
            ;;
        "Unknown")
            warning "Cannot get command status"
            if [ $ELAPSED_TIME -gt 300 ]; then
                error "Giving up after 5 minutes of unknown status"
                exit 1
            fi
            ;;
        *)
            log "Status: $STATUS"
            ;;
    esac

    sleep $WAIT_INTERVAL
    ELAPSED_TIME=$((ELAPSED_TIME + WAIT_INTERVAL))
done

error "Timed out after ${MAX_WAIT_TIME}s"
warning "Check manually:"
echo "aws ssm get-command-invocation --region $EC2_REGION --command-id $COMMAND_ID --instance-id $INSTANCE_ID"
exit 1
