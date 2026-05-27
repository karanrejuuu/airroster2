# Airline Crew Roster - Requirements

## Project Summary

Build an Airline Crew Roster application to capture the details of crew members and map them to airlines, flights, and the flight routes they need to travel on.

## Core Masters

1. Crew Master
   - Store details of Pilots, First Officers, and Flight Attendants.
   - Track role, rank, airline, base airport, duty hours, leave balance, licence details, and medical expiry.

2. Airline Master
   - Store airline details.
   - Track airline name, IATA code, ICAO code, country, hub airport, and status.

3. Flight Master
   - Store reusable flight details.
   - Track flight number, airline, aircraft type, aircraft registration, and required crew count.

4. Flight Route
   - Store actual scheduled flight movement.
   - Track date, time, sector, duration, distance, route status, and assigned crew.

## Main Functional Requirements

- Admin can create, view, update, and deactivate records in all four masters.
- Dispatcher can view masters and assign crew to flight routes.
- Pilot and cabin crew can view their own roster, flight briefing, leave, and profile.
- System must prevent obvious roster conflicts such as rank mismatch, double booking, rest-period violation, and duty-limit breach.
- System must support leave requests and leave review.
- System must include seeded demo data for quick testing.

## Login Roles

- Admin: full access.
- Dispatcher: crew assignment and operational views.
- Pilot: own roster and briefings.
- Cabin Crew: own roster and briefings.
