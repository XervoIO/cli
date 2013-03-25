#!/bin/bash

ITERATIONS=10

expect login.exp

for i in `seq 1 $ITERATIONS`
do
  expect deploy.exp ./test-projects/roadrunner
done