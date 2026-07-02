#!/usr/bin/env bash
export PATH="$HOME/.compact/versions/0.30.0/x86_64-unknown-linux-musl:$PATH"
compactc.bin contract/src/sealed_bidding.compact contract/managed
