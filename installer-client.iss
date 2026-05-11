; OmniSight CLIENT Setup with Dynamic Uninstall Password

#define MyAppName "OmniSight Client"
#define MyAppVersion "1.0.1"
#define MyClientExeName "OmniSight.Client.exe"

[Setup]
AppId={{E5A6B3C2-9F0D-4E3A-B6C7-D8E9F0A1B2C3}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
DefaultDirName={autopf}\OmniSight\Client
DefaultGroupName=OmniSight
OutputDir=bin\Installer
OutputBaseFilename=OmniSight-Client-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableProgramGroupPage=yes
CloseApplications=force
AppMutex=Global\OmniSightClientMutex

[Files]
Source: "src\OmniSight.Client\bin\Release\net10.0-windows\win-x64\publish\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; Permissions: system-full admins-full users-readexec

[Dirs]
Name: "{app}"; Permissions: system-full admins-full users-readexec

[Registry]
; Store the password in registry for the uninstaller to read
Root: HKLM; Subkey: "Software\OmniSight\Client"; ValueType: string; ValueName: "UninstallPwd"; ValueData: "{code:GetUninstallPassword}"; Flags: uninsdeletekey
; Auto-run in User Session (Crucial for screen capture)
Root: HKLM; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "OmniSightClient"; ValueData: """{app}\{#MyClientExeName}"""; Flags: uninsdeletevalue

[Code]
var
  DeviceNameEdit: TEdit;
  DashboardIPEdit: TEdit;
  UninstallPassEdit: TEdit;
  ShowPassBtn: TButton;
  IsSetupPassVisible: Boolean;

procedure ShowPassClick(Sender: TObject);
begin
  IsSetupPassVisible := not IsSetupPassVisible;
  if IsSetupPassVisible then
  begin
    UninstallPassEdit.PasswordChar := #0;
    ShowPassBtn.Caption := 'Hide';
  end
  else
  begin
    UninstallPassEdit.PasswordChar := '*';
    ShowPassBtn.Caption := 'Show';
  end;
end;

procedure InitializeWizard();
var
  Page: TWizardPage;
  Label1, Label2, Label3: TLabel;
begin
  IsSetupPassVisible := False;
  Page := CreateCustomPage(wpSelectDir, 'Configuration', 'Please specify the device name, dashboard IP, and an uninstallation password.');
  
  Label1 := TLabel.Create(Page);
  Label1.Parent := Page.Surface;
  Label1.Caption := 'Device Name:';
  Label1.SetBounds(0, 0, Page.SurfaceWidth, 16);

  DeviceNameEdit := TEdit.Create(Page);
  DeviceNameEdit.Parent := Page.Surface;
  DeviceNameEdit.SetBounds(0, 20, Page.SurfaceWidth, 24);
  DeviceNameEdit.Text := GetComputerNameString();

  Label2 := TLabel.Create(Page);
  Label2.Parent := Page.Surface;
  Label2.Caption := 'Dashboard IP (e.g. 192.168.1.10):';
  Label2.SetBounds(0, 60, Page.SurfaceWidth, 16);

  DashboardIPEdit := TEdit.Create(Page);
  DashboardIPEdit.Parent := Page.Surface;
  DashboardIPEdit.SetBounds(0, 80, Page.SurfaceWidth, 24);
  DashboardIPEdit.Text := 'localhost';

  Label3 := TLabel.Create(Page);
  Label3.Parent := Page.Surface;
  Label3.Caption := 'Uninstall Password:';
  Label3.SetBounds(0, 120, Page.SurfaceWidth, 16);

  UninstallPassEdit := TEdit.Create(Page);
  UninstallPassEdit.Parent := Page.Surface;
  UninstallPassEdit.SetBounds(0, 140, Page.SurfaceWidth - 60, 24);
  UninstallPassEdit.PasswordChar := '*';
  UninstallPassEdit.Text := 'admin123';

  ShowPassBtn := TButton.Create(Page);
  ShowPassBtn.Parent := Page.Surface;
  ShowPassBtn.SetBounds(Page.SurfaceWidth - 55, 139, 55, 26);
  ShowPassBtn.Caption := 'Show';
  ShowPassBtn.OnClick := @ShowPassClick;
end;

function GetUninstallPassword(Param: String): String;
begin
  Result := UninstallPassEdit.Text;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  JsonContent: String;
begin
  if CurStep = ssPostInstall then
  begin
    JsonContent := '{ "MachineName": "' + DeviceNameEdit.Text + '", "DashboardUrl": "http://' + DashboardIPEdit.Text + ':5000" }';
    SaveStringToFile(ExpandConstant('{app}\appsettings.json'), JsonContent, False);
  end;
end;

var
  UninstPassEdit: TEdit;
  UninstShowBtn: TButton;
  IsUninstPassVisible: Boolean;

procedure UninstShowClick(Sender: TObject);
begin
  IsUninstPassVisible := not IsUninstPassVisible;
  if IsUninstPassVisible then
  begin
    UninstPassEdit.PasswordChar := #0;
    UninstShowBtn.Caption := 'Hide';
  end
  else
  begin
    UninstPassEdit.PasswordChar := '*';
    UninstShowBtn.Caption := 'Show';
  end;
end;

function InitializeUninstall(): Boolean;
var
  PasswordForm: TForm;
  PasswordLabel: TLabel;
  OkButton, CancelButton: TButton;
  StoredPwd: String;
  ResultCode: Integer;
begin
  Result := False;
  IsUninstPassVisible := False;
  
  // Retrieve the custom password set during installation
  if not RegQueryStringValue(HKLM, 'Software\OmniSight\Client', 'UninstallPwd', StoredPwd) then
    StoredPwd := 'admin123'; // Fallback if registry fails

  PasswordForm := TForm.Create(nil);
  try
    PasswordForm.ClientWidth := 300;
    PasswordForm.ClientHeight := 150;
    PasswordForm.Caption := 'Security Verification';
    PasswordForm.Position := poScreenCenter;

    PasswordLabel := TLabel.Create(PasswordForm);
    PasswordLabel.Parent := PasswordForm;
    PasswordLabel.SetBounds(20, 20, 260, 40);
    PasswordLabel.Caption := 'Enter the custom password defined during installation to remove this client:';
    PasswordLabel.WordWrap := True;

    UninstPassEdit := TEdit.Create(PasswordForm);
    UninstPassEdit.Parent := PasswordForm;
    UninstPassEdit.SetBounds(20, 65, 200, 24);
    UninstPassEdit.PasswordChar := '*';

    UninstShowBtn := TButton.Create(PasswordForm);
    UninstShowBtn.Parent := PasswordForm;
    UninstShowBtn.SetBounds(225, 64, 55, 26);
    UninstShowBtn.Caption := 'Show';
    UninstShowBtn.OnClick := @UninstShowClick;

    OkButton := TButton.Create(PasswordForm);
    OkButton.Parent := PasswordForm;
    OkButton.Caption := 'OK';
    OkButton.Default := True;
    OkButton.ModalResult := mrOk;
    OkButton.SetBounds(110, 105, 75, 25);

    CancelButton := TButton.Create(PasswordForm);
    CancelButton.Parent := PasswordForm;
    CancelButton.Caption := 'Cancel';
    CancelButton.ModalResult := mrCancel;
    CancelButton.SetBounds(200, 105, 75, 25);

    if PasswordForm.ShowModal() = mrOk then
    begin
      if UninstPassEdit.Text = StoredPwd then
      begin
        // SUCCESS: Now kill everything immediately
        Exec(ExpandConstant('{sys}\sc.exe'), 'stop OmniSightClient', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
        Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM {#MyClientExeName} /T', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
        Result := True;
      end
      else
        MsgBox('Incorrect password. Uninstallation aborted.', mbError, MB_OK);
    end;
  finally
    PasswordForm.Free();
  end;
end;

[Run]
; Firewall Rule
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall add rule name=""OmniSight Client"" dir=out action=allow program=""{app}\{#MyClientExeName}"" enable=yes"; Flags: runhidden
; Service Management
Filename: "{sys}\sc.exe"; Parameters: "stop OmniSightClient"; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "delete OmniSightClient"; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "create OmniSightClient binPath= ""{app}\{#MyClientExeName}"" start= auto displayname= ""OmniSight Client Service"""; Flags: runhidden
Filename: "{sys}\net.exe"; Parameters: "start OmniSightClient"; Flags: runhidden

[UninstallRun]
Filename: "{sys}\sc.exe"; Parameters: "stop OmniSightClient"; Flags: runhidden
Filename: "{sys}\sc.exe"; Parameters: "delete OmniSightClient"; Flags: runhidden
Filename: "{sys}\netsh.exe"; Parameters: "advfirewall firewall delete rule name=""OmniSight Client"""; Flags: runhidden
