{
  description = "Moonverse development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            nodejs_23
            openssl
            bun
          ];

          shellHook = ''
            export PATH="$PWD/node_modules/.bin:$PATH"
            export OPENSSL_DEV="${pkgs.openssl.dev}"
            export OPENSSL_LIB="${pkgs.openssl.out}/lib"
          '';
        };
      }
    );
}
