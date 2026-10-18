import test from 'node:test';
import assert from 'node:assert/strict';
import {createRaceClock,formatRaceTime,readRaceBests} from '../race-clock.js';
test('the stopwatch runs continuously until finish and resets',()=>{
 let now=500;const clock=createRaceClock(()=>now);now+=2000;assert.equal(clock.elapsed(),0);
 clock.start();now+=1550;assert.equal(clock.elapsed(),1550);
 now+=40000;assert.equal(clock.elapsed(),41550);
 now+=450;assert.equal(clock.finish(),42000);
 now+=8000;assert.equal(clock.elapsed(),42000);clock.reset();assert.equal(clock.elapsed(),0);
 clock.start();now+=20;assert.equal(clock.elapsed(),20);
});
test('delayed frames cannot yield a faster race time',()=>{
 let now=0;const clock=createRaceClock(()=>now);clock.start();
 // A physics frame is capped at 100ms; the race must still charge the whole delay.
 now=2578;assert.equal(clock.elapsed(),2578);now+=42500;assert.equal(clock.finish(),45078);
});
test('race times display minutes, seconds and hundredths across minute boundaries',()=>{
 for(const [value,text] of [[0,'0:00.00'],[999,'0:00.99'],[59999,'0:59.99'],[60000,'1:00.00'],[125670,'2:05.67'],[3600000,'60:00.00']])assert.equal(formatRaceTime(value),text);
});
test('invalid local best records do not poison a new timed run',()=>{
 assert.deepEqual(readRaceBests('oops'),{});assert.deepEqual(readRaceBests(null),{});
 assert.deepEqual(readRaceBests('{"leather":45123,"canvas":-1,"knit":"1","other":12}'),{leather:45123});
});
test('section splits preserve all elapsed time and cannot be recorded twice',()=>{
 let now=0;const clock=createRaceClock(()=>now);clock.start();
 now=12345;assert.deepEqual(clock.split(0),{elapsed:12345,duration:12345});
 now+=60000;now+=8456;
 assert.deepEqual(clock.split(1),{elapsed:80801,duration:68456});
 now+=1000;assert.equal(clock.split(1).duration,68456);assert.equal(clock.split(3),null);
 now+=7000;const total=clock.finish();clock.split(2);
 assert.equal(clock.splits().reduce((sum,s)=>sum+s.duration,0),total);
 const copy=clock.splits();copy[0].duration=0;assert.equal(clock.splits()[0].duration,12345);
 clock.reset();assert.deepEqual(clock.splits(),[]);
 clock.start();now+=20;assert.equal(clock.split(0).duration,20);
 clock.start();assert.deepEqual(clock.splits(),[]);
});
