using System.Windows.Forms;
using System.Drawing;

namespace OmniSight.Client.Services;

public class BroadcastOverlay
{
    private static Form? _activeForm;
    private static DateTime _shownAt;
    private static readonly object _lock = new();

    public void Show(string message)
    {
        CloseInternal();

        Thread thread = new(() =>
        {
            lock (_lock)
            {
                _shownAt = DateTime.Now;
                _activeForm = new Form
                {
                    FormBorderStyle = FormBorderStyle.None,
                    TopMost = true, // Initial Z-index
                    ShowInTaskbar = false,
                    BackColor = Color.FromArgb(20, 20, 20),
                    StartPosition = FormStartPosition.CenterScreen,
                    Width = 450,
                    Height = 220,
                    Opacity = 0.98
                };

                _activeForm.Paint += (s, e) => {
                    ControlPaint.DrawBorder(e.Graphics, _activeForm.ClientRectangle, Color.FromArgb(0, 120, 215), ButtonBorderStyle.Solid);
                };

                Label msgLabel = new Label
                {
                    Text = message,
                    ForeColor = Color.White,
                    Font = new Font("Segoe UI", 12, FontStyle.Bold),
                    AutoSize = false,
                    Width = _activeForm.Width - 60,
                    Height = 100,
                    Left = 30,
                    Top = 40,
                    TextAlign = ContentAlignment.MiddleCenter
                };

                Button btnClose = new Button
                {
                    Text = "CLOSE",
                    FlatStyle = FlatStyle.Flat,
                    ForeColor = Color.White,
                    BackColor = Color.FromArgb(40, 40, 40),
                    Font = new Font("Segoe UI", 8, FontStyle.Bold),
                    Width = 100,
                    Height = 35,
                    Left = (_activeForm.Width / 2) - 50,
                    Top = 150,
                    Visible = false,
                    Cursor = Cursors.Hand
                };
                btnClose.FlatAppearance.BorderSize = 0;
                btnClose.Click += (s, e) => CloseInternal();

                _activeForm.Controls.Add(msgLabel);
                _activeForm.Controls.Add(btnClose);

                System.Windows.Forms.Timer logicTimer = new System.Windows.Forms.Timer();
                logicTimer.Interval = 500; // Check every 0.5s for Z-index
                logicTimer.Tick += (s, e) => {
                    var elapsed = (DateTime.Now - _shownAt).TotalSeconds;
                    
                    // Force Highest Z-Index recurringly
                    if (_activeForm != null) {
                        _activeForm.TopMost = true;
                        _activeForm.BringToFront();
                    }

                    if (elapsed >= 3 && !btnClose.Visible) btnClose.Visible = true;
                    if (elapsed >= 5) { logicTimer.Stop(); CloseInternal(); }
                };
                logicTimer.Start();

                Application.Run(_activeForm);
            }
        });
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
    }

    public void Close()
    {
        if ((DateTime.Now - _shownAt).TotalSeconds >= 3) CloseInternal();
    }

    private void CloseInternal()
    {
        lock (_lock)
        {
            if (_activeForm != null)
            {
                try {
                    if (_activeForm.InvokeRequired) _activeForm.Invoke(new Action(() => _activeForm.Close()));
                    else _activeForm.Close();
                } catch { }
                _activeForm = null;
            }
        }
    }
}
