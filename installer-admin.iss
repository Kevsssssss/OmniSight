; OmniSight ADMIN (Dashboard) Setup

#define MyAppName "OmniSight Admin"
#define MyAppVersion "1.0.1"
#define MyAppPublisher "OmniSight Project"
#define MyAppExeName "OmniSight.Dashboard.exe"

[Setup]
AppId={{D3F7B2A1-8E9C-4D2F-A5B6-C7D8E9F0A1B2}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\OmniSight\Admin
DefaultGroupName=OmniSight
OutputDir=bin\Installer
OutputBaseFilename=OmniSight-Admin-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Files]
Source: "src\OmniSight.Dashboard\bin\Release\net10.0-windows\win-x64\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "docs\manual\OmniSight_Manual.pdf"; DestDir: "{app}"; Flags: ignoreversion

[Code]
var
  AdminUserEdit: TEdit;
  AdminPassEdit: TEdit;
  ShowPassBtn: TButton;
  IsPassVisible: Boolean;

procedure ShowPassClick(Sender: TObject);
begin
  IsPassVisible := not IsPassVisible;
  if IsPassVisible then
  begin
    AdminPassEdit.PasswordChar := #0;
    ShowPassBtn.Caption := 'Hide';
  end
  else
  begin
    AdminPassEdit.PasswordChar := '*';
    ShowPassBtn.Caption := 'Show';
  end;
end;

procedure InitializeWizard();
var
  Page: TWizardPage;
  UserLabel, PassLabel: TLabel;
begin
  IsPassVisible := False;
  Page := CreateCustomPage(wpSelectDir, 'Administrator Setup', 'Please specify the administrator username and password for dashboard access.');
  
  UserLabel := TLabel.Create(Page);
  UserLabel.Parent := Page.Surface;
  UserLabel.Caption := 'Username:';
  UserLabel.SetBounds(0, 0, Page.SurfaceWidth, 16);

  AdminUserEdit := TEdit.Create(Page);
  AdminUserEdit.Parent := Page.Surface;
  AdminUserEdit.SetBounds(0, 20, Page.SurfaceWidth, 24);
  AdminUserEdit.Text := 'admin';

  PassLabel := TLabel.Create(Page);
  PassLabel.Parent := Page.Surface;
  PassLabel.Caption := 'Password:';
  PassLabel.SetBounds(0, 60, Page.SurfaceWidth, 16);

  AdminPassEdit := TEdit.Create(Page);
  AdminPassEdit.Parent := Page.Surface;
  AdminPassEdit.SetBounds(0, 80, Page.SurfaceWidth - 60, 24);
  AdminPassEdit.PasswordChar := '*';
  AdminPassEdit.Text := 'admin123';

  ShowPassBtn := TButton.Create(Page);
  ShowPassBtn.Parent := Page.Surface;
  ShowPassBtn.SetBounds(Page.SurfaceWidth - 55, 79, 55, 26);
  ShowPassBtn.Caption := 'Show';
  ShowPassBtn.OnClick := @ShowPassClick;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  JsonContent: String;
  ConfigDir: String;
begin
  if CurStep = ssPostInstall then
  begin
    ConfigDir := ExpandConstant('{localappdata}\OmniSight');
    if not DirExists(ConfigDir) then
      ForceDirectories(ConfigDir);
      
    // Create the initial global_settings.json with the chosen credentials
    JsonContent := '{ "ClientSettings": { "TargetFps": 5, "JpegQuality": 30 }, "Username": "' + 
                   AdminUserEdit.Text + '", "Password": "' + AdminPassEdit.Text + '" }';
    SaveStringToFile(ConfigDir + '\global_settings.json', JsonContent, False);
  end;
end;

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\Technical Manual"; Filename: "{app}\OmniSight_Manual.pdf"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"

[Run]
; Opens the firewall so your Phone can connect to this PC on port 5000
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""OmniSight Dashboard"" dir=in action=allow protocol=TCP localport=5000 enable=yes"; Flags: runhidden
Filename: "{app}\{#MyAppExeName}"; Description: "Launch OmniSight Dashboard"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Force kill the Dashboard process if it's still running
Filename: "taskkill"; Parameters: "/F /IM {#MyAppExeName} /T"; Flags: runhidden
; Clean up the firewall rule on uninstall
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""OmniSight Dashboard"""; Flags: runhidden
