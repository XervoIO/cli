#!/bin/bash

ITERATIONS=50

expect login.exp

for i in `seq 1 $ITERATIONS`
do
  expect deploy.exp ./test-projects/roadrunner
  sleep 2
  expect stop.exp
  sleep 2
done