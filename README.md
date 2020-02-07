# ring-pi

This project is based on [ring-client-api](https://www.npmjs.com/package/ring-client-api)

It is a very basic CLI tool for arming a Ring home security system in HOME or AWAY mode, and for DISARMING.

- Automatically arm your system to `HOME` every night
- Setup custom rules that interact with your smart home setup
- Sitting at your computer, want to arm the alarm, but you're too lazy to get up and your phone is across the room?  Just run `ring home`.
- Use your imagination

`ring [status|home|away|disarm] [auth [srv]]`

## status
This will show the current state of your ring alarm.

## auth
If an `auth.json` file is not present, the `auth` flag defaults to `true`.

This will prompt for your Ring username/password, and will then save the refreshToken to `auth.json` in your project directory.

Future calls to the app will connect automatically using the token in `auth.json`.

## srv
If you will be running this on a separate server (eg: Raspberry Pi), this argument will prompt you for server information (host/dir/user/pass) and save all but the password to 'srv.json'.

Whenever you run this script locally with the auth flag, a copy of `auth.json` will be copied to this server at the path specified.  Once `srv.json` exists, you will be prompted for ONLY the password in the future when using the `auth` flag.

The `refreshToken` will expire every so often (~ 2 weeks).  This is goverened by Ring.  As far as I know Ring is a closed system, so there isn't a way to get a permanent API key.  I run this on my system once a week with the `auth` flag to push a new refreshToken to my Raspberry Pi.

Do you want to update the token without arming/disarming, run it with `status`:
```
ring status auth [srv]
```

This does not yet support certificate based authentication.  Feel free to add that support if you need it.

## Other
If you don't want to worry about the refreshToken expiring, you can edit the code to authenticate soley with username/pass.  I choose not to do this for security reasons, but it's an option.