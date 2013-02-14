#!/bin/bash

ITERATIONS=100

expect login.exp

for i in `seq 1 $ITERATIONS`
do
  if ((`expr $i % 2` == 0)); then
    expect scale.exp 1
  else
    expect scale.exp 2
  fi
done
