#!/bin/bash

ITERATIONS=50

expect login.exp

for i in `seq 1 $ITERATIONS`
do
  expect scale-up.exp
  sleep 2
  expect scale-down.exp
  sleep 2
done