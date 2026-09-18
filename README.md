# DollarCash Foundation

Build the foundation of a modern mobile-first fintech web app called DollarCash.



Tech stack:



- React/Next.js

- Tailwind CSS

- Supabase Auth + PostgreSQL + RLS



Design



Create a premium animated UI using:



- Forest Green

- Gold

- Deep Navy

- Light/Dark mode

- Smooth lightweight animations

- Mobile-first responsive design



Do NOT use crypto, blockchain, Bitcoin, coin or cryptocurrency graphics.



Authentication



Use phone number instead of email.



Create:



/login

/register

/forgot-password

/dashboard

/dashboard/profile

/admin



Registration fields:



- Full Name

- Phone Number

- Password

- Confirm Password

- Optional Referral Code



Use Supabase Phone Authentication with OTP where supported.



User Profile



Create "profiles" table:



- id

- full_name

- phone

- role

- balance

- referral_code

- referred_by

- is_banned

- created_at

- updated_at



New users automatically receive:



- role = user

- balance = 0

- is_banned = false

- unique referral code



Users must never be able to change their own role, balance or banned status.



Admin



Create secure role-based admin authentication.



The admin account will use the phone number:



03133221347



This phone number should belong to the admin account in Supabase.



Set its database role to:



admin



Do NOT hard-code admin access in frontend code.



Admin authorization must be checked securely from Supabase/backend.



For "/admin":



- Not logged in → "/login"

- Normal user → "/dashboard"

- Admin → "/admin"



Dashboard



Create a polished dashboard with:



- Welcome message

- Main Balance: $0.00

- Active Plans: 0

- Total Earnings: $0.00

- Referrals: 0

- Pending Transactions: 0



Navigation:



Dashboard

Investment Plans

Daily Tasks

Deposit

Withdraw

Referrals

Transactions

Profile

Logout



Future features can show "Coming Soon".



Admin Dashboard



Create a simple secure Admin Control Panel placeholder with:



- Users

- Deposits

- Withdrawals

- Payment Methods



Full admin functionality will be added in later phases.



Supabase Security



Enable RLS.



Users can only access their own profile.



Never allow users to:



- Change their role

- Change their balance

- Make themselves admin

- Change banned status

- Access another user's private data



Important



This is ONLY Part 1 + Part 2.



Do NOT build investment plans, daily profit, tasks, referrals, deposits, withdrawals or full admin management yet.



Keep everything modular and ready for the next phases.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ef45152a-8aca-443a-af70-d6c664817b7f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
