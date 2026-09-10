export const CRICKET_ROLES = [
  'Batsman',
  'Bowler',
  'All-Rounder',
  'Wicketkeeper-Batsman',
] as const;

export type CricketRole = (typeof CRICKET_ROLES)[number];

export const IPL_TEAMS = [
  'Chennai Super Kings',
  'Delhi Capitals',
  'Gujarat Titans',
  'Kolkata Knight Riders',
  'Lucknow Super Giants',
  'Mumbai Indians',
  'Punjab Kings',
  'Rajasthan Royals',
  'Royal Challengers Bengaluru',
  'Sunrisers Hyderabad',
] as const;

export type IplTeam = (typeof IPL_TEAMS)[number];

export const BATTING_STYLES = [
  'Right-Handed',
  'Left-Handed',
  'Prefer Not to Say',
] as const;

export type BattingStyle = (typeof BATTING_STYLES)[number];

export const BOWLING_STYLES = [
  'Right-Arm Fast',
  'Left-Arm Fast',
  'Right-Arm Medium',
  'Left-Arm Medium',
  'Right-Arm Spin',
  'Left-Arm Spin',
  'Does Not Bowl',
] as const;

export type BowlingStyle = (typeof BOWLING_STYLES)[number];

export const CRICKET_PLAYERS = [
  // India
  'Virat Kohli',
  'Rohit Sharma',
  'MS Dhoni',
  'Jasprit Bumrah',
  'Hardik Pandya',
  'Suryakumar Yadav',
  'Shubman Gill',
  'Rishabh Pant',
  'KL Rahul',
  'Ravindra Jadeja',
  'Ravichandran Ashwin',
  'Mohammed Shami',
  'Mohammed Siraj',
  'Shreyas Iyer',
  'Yashasvi Jaiswal',
  'Kuldeep Yadav',
  'Axar Patel',
  'Sanju Samson',
  'Rinku Singh',
  'Ishan Kishan',
  'Arshdeep Singh',
  'Yuzvendra Chahal',
  'Ruturaj Gaikwad',
  'Tilak Varma',
  'Washington Sundar',
  // International Legends & Modern Stars
  'Steve Smith',
  'Kane Williamson',
  'Joe Root',
  'Pat Cummins',
  'Mitchell Starc',
  'Travis Head',
  'Glenn Maxwell',
  'David Warner',
  'Heinrich Klaasen',
  'Kagiso Rabada',
  'Quinton de Kock',
  'Rashid Khan',
  'Babar Azam',
  'Shaheen Afridi',
  'Jos Buttler',
  'Ben Stokes',
  'Trent Boult',
  'Nicholas Pooran',
  'Andre Russell',
  'Sunil Narine',
  'Shakib Al Hasan',
  'Wanindu Hasaranga',
  'Sachin Tendulkar',
  'AB de Villiers',
  'Chris Gayle',
] as const;

export const FOOTBALL_POSITIONS = [
  'Goalkeeper',
  'Centre-Back',
  'Full-Back',
  'Defensive Midfielder',
  'Central Midfielder',
  'Attacking Midfielder',
  'Winger',
  'Striker',
  'Forward',
] as const;

export type FootballPosition = (typeof FOOTBALL_POSITIONS)[number];

export const FOOTBALL_CLUBS = [
  // Indian Clubs (ISL & I-League)
  'Mohun Bagan Super Giant',
  'East Bengal',
  'Bengaluru FC',
  'Mumbai City FC',
  'FC Goa',
  'Kerala Blasters',
  'Odisha FC',
  'Chennaiyin FC',
  'Hyderabad FC',
  'NorthEast United FC',
  'Jamshedpur FC',
  'Mohammedan SC',
  // Major International Clubs
  'Real Madrid',
  'Barcelona',
  'Manchester United',
  'Manchester City',
  'Liverpool',
  'Arsenal',
  'Chelsea',
  'Tottenham Hotspur',
  'Bayern Munich',
  'Borussia Dortmund',
  'Paris Saint-Germain',
  'Juventus',
  'Inter Milan',
  'AC Milan',
  'Atletico Madrid',
  'Napoli',
  'AS Roma',
  'Sporting CP',
  'Benfica',
  'Ajax',
  'Al-Nassr',
  'Inter Miami',
] as const;

export type FootballClub = (typeof FOOTBALL_CLUBS)[number];

export const FOOTBALL_PLAYERS = [
  // Indian National Stars
  'Sunil Chhetri',
  'Gurpreet Singh Sandhu',
  'Sandesh Jhingan',
  'Lallianzuala Chhangte',
  'Sahal Abdul Samad',
  'Manvir Singh',
  'Subhasish Bose',
  'Amrinder Singh',
  'Liston Colaco',
  'Anirudh Thapa',
  'Jeakson Singh',
  'Mahesh Singh Naorem',
  'Bipin Singh',
  // International Global Stars
  'Lionel Messi',
  'Cristiano Ronaldo',
  'Kylian Mbappé',
  'Erling Haaland',
  'Jude Bellingham',
  'Kevin De Bruyne',
  'Vinícius Júnior',
  'Mohamed Salah',
  'Harry Kane',
  'Luka Modrić',
  'Robert Lewandowski',
  'Neymar Jr',
  'Bukayo Saka',
  'Rodri',
  'Antoine Griezmann',
  'Son Heung-min',
  'Virgil van Dijk',
  'Alisson Becker',
  'Thibaut Courtois',
  'Federico Valverde',
  'Phil Foden',
  'Florian Wirtz',
  'Lamine Yamal',
  'Ronaldinho',
  'Zinedine Zidane',
] as const;

export const PREFERRED_FEET = ['Right', 'Left', 'Both'] as const;

export type PreferredFoot = (typeof PREFERRED_FEET)[number];

export const SUPPORTED_SPORTS = ['Cricket', 'Football'] as const;
export type SupportedSport = (typeof SUPPORTED_SPORTS)[number];
