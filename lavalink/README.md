# Lavalink
- Download Lavalink v4 or above [**Click Me**]("https://github.com/lavalink-devs/Lavalink)
- Download and install Java JDK [**Click Me**]("https://www.oracle.com/java/technologies/downloads/)

### Get started!
- Download lavalink.jar file and create a application.yml file. Fill spotify token and all the necessary.
- Launch command:
```shell
java -jar Lavalink.jar
```

### Note
- You should launch lavalink and discord bot seperatly and run Lavalink before starting the discord bot.
- Also make sure that your firewall is not interfering with the Lavalink (Port forwarding or Perms).
- Autorun lavalink in **Linux**:<br>
  - Create file at `/etc/systemd/system`: <br>
  **lavalink.service**
  ```shell
  [Unit]
  Description=Mod-Phase
  After=network.target
  
  [Service]
  CPUQuota=60%
  CPUQuotaPeriodSec=1ms
  Type=simple
  Restart=always
  RestartSec=60
  RemainAfterExit=true
  WorkingDirectory=<Lavalink Dir>
  ExecStart=java -jar <Lavalink Dir>/Lavalink.jar
  User=username
  # Create a logs folder in the dir.
  StandardOutput=append:<Lavalink Dir>/logs/std.log
  StandardError=append:<Lavalink Dir>/logs/err.log

  [Install]
  WantedBy=multi-user.target
  ```
  - Use this command to start the service:
  ```shell
  sudo systemctl enable lavalink
  sudo systemctl start lavalink
  sudo systemctl status lavalink
  # Restart lavalink if needed
  sudo systemctl restart lavalink
  ```