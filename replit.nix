{ pkgs }: {
  deps = [
    pkgs.nodejs_18
    pkgs.python311
    pkgs.nodePackages.pm2
  ];
}
