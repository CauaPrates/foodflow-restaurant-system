using System;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace RestauranteLauncher
{
    public partial class ControllerForm : Form
    {
        private Button controlButton;
        private Label statusLabel;
        private Label titleLabel;
        private Panel logoPanel;
        private Label statusIconLabel;
        private Panel mainPanel;
        private Button closeButton;
        private System.Windows.Forms.Timer statusTimer;
        private bool isSystemRunning = false;
        private Process? backendProcess;
        private Process? frontendProcess;
        private string projectPath;

        public ControllerForm()
        {
            projectPath = Path.GetDirectoryName(Application.ExecutablePath) ?? Environment.CurrentDirectory;
            InitializeComponent();
            StartStatusMonitoring();
        }

        private void InitializeComponent()
        {
            this.Size = new Size(480, 320);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 15, 23);
            this.Text = "Controlador - FoodFlow";
            this.Icon = SystemIcons.Application;

            // Painel principal com gradiente
            mainPanel = new Panel
            {
                Size = new Size(460, 300),
                Location = new Point(10, 10),
                BackColor = Color.Transparent
            };
            mainPanel.Paint += MainPanel_Paint;
            this.Controls.Add(mainPanel);

            // Logo/Ícone moderno
            logoPanel = new Panel
            {
                Size = new Size(80, 80),
                Location = new Point(190, 30),
                BackColor = Color.Transparent
            };
            logoPanel.Paint += LogoPanel_Paint;
            mainPanel.Controls.Add(logoPanel);

            // Título com fonte moderna
            titleLabel = new Label
            {
                Text = "🍽️ FoodFlow",
                Font = new Font("Segoe UI", 16, FontStyle.Bold),
                ForeColor = Color.White,
                Size = new Size(440, 35),
                Location = new Point(10, 120),
                TextAlign = ContentAlignment.MiddleCenter,
                BackColor = Color.Transparent
            };
            mainPanel.Controls.Add(titleLabel);

            // Ícone de status
            statusIconLabel = new Label
            {
                Text = "⚡",
                Font = new Font("Segoe UI", 20),
                ForeColor = Color.Orange,
                Size = new Size(40, 30),
                Location = new Point(150, 165),
                TextAlign = ContentAlignment.MiddleCenter,
                BackColor = Color.Transparent
            };
            mainPanel.Controls.Add(statusIconLabel);

            // Status com melhor tipografia
            statusLabel = new Label
            {
                Text = "Verificando status...",
                Font = new Font("Segoe UI", 11, FontStyle.Regular),
                ForeColor = Color.FromArgb(200, 200, 200),
                Size = new Size(250, 25),
                Location = new Point(195, 170),
                TextAlign = ContentAlignment.MiddleLeft,
                BackColor = Color.Transparent
            };
            mainPanel.Controls.Add(statusLabel);

            // Botão de controle moderno
            controlButton = new ModernButton
            {
                Text = "Verificando...",
                Font = new Font("Segoe UI", 12, FontStyle.Bold),
                Size = new Size(220, 50),
                Location = new Point(120, 220),
                BackColor = Color.FromArgb(52, 152, 219),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Enabled = false,
                Cursor = Cursors.Hand
            };
            controlButton.FlatAppearance.BorderSize = 0;
            controlButton.Click += ControlButton_Click;
            mainPanel.Controls.Add(controlButton);

            // Timer para monitoramento
            statusTimer = new System.Windows.Forms.Timer
            {
                Interval = 3000 // Verificar a cada 3 segundos
            };
            statusTimer.Tick += StatusTimer_Tick;

            // Botão de fechar
            closeButton = new Button
            {
                Text = "✕",
                Font = new Font("Segoe UI", 14, FontStyle.Bold),
                Size = new Size(35, 35),
                Location = new Point(435, 15),
                BackColor = Color.Transparent,
                ForeColor = Color.FromArgb(180, 180, 180),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            closeButton.FlatAppearance.BorderSize = 0;
            closeButton.FlatAppearance.MouseOverBackColor = Color.FromArgb(231, 76, 60);
            closeButton.FlatAppearance.MouseDownBackColor = Color.FromArgb(192, 57, 43);
            closeButton.Click += CloseButton_Click;
            closeButton.BringToFront();
            this.Controls.Add(closeButton);
            closeButton.BringToFront();

            // Adicionar eventos para arrastar a janela
            this.MouseDown += Form_MouseDown;
            mainPanel.MouseDown += Form_MouseDown;
            titleLabel.MouseDown += Form_MouseDown;
        }

        private void CloseButton_Click(object sender, EventArgs e)
        {
            this.Close();
        }

        private void MainPanel_Paint(object sender, PaintEventArgs e)
        {
            // Gradiente de fundo
            using (LinearGradientBrush brush = new LinearGradientBrush(
                mainPanel.ClientRectangle,
                Color.FromArgb(30, 30, 46),
                Color.FromArgb(20, 20, 35),
                LinearGradientMode.Vertical))
            {
                e.Graphics.FillRoundedRectangle(brush, mainPanel.ClientRectangle, 15);
            }

            // Borda sutil
            using (Pen pen = new Pen(Color.FromArgb(60, 60, 80), 1))
            {
                e.Graphics.DrawRoundedRectangle(pen, new Rectangle(0, 0, mainPanel.Width - 1, mainPanel.Height - 1), 15);
            }
        }

        private void LogoPanel_Paint(object sender, PaintEventArgs e)
        {
            // Círculo com gradiente para o logo
            using (LinearGradientBrush brush = new LinearGradientBrush(
                logoPanel.ClientRectangle,
                Color.FromArgb(52, 152, 219),
                Color.FromArgb(41, 128, 185),
                LinearGradientMode.Vertical))
            {
                e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
                e.Graphics.FillEllipse(brush, 5, 5, 70, 70);
            }

            // Ícone do restaurante
            using (Font iconFont = new Font("Segoe UI", 24, FontStyle.Bold))
            using (SolidBrush textBrush = new SolidBrush(Color.White))
            {
                string icon = "🍽️";
                SizeF textSize = e.Graphics.MeasureString(icon, iconFont);
                float x = (logoPanel.Width - textSize.Width) / 2;
                float y = (logoPanel.Height - textSize.Height) / 2;
                e.Graphics.DrawString(icon, iconFont, textBrush, x, y);
            }
        }

        private void Form_MouseDown(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                // Permitir arrastar a janela
                ReleaseCapture();
                SendMessage(this.Handle, WM_NCLBUTTONDOWN, HT_CAPTION, 0);
            }
        }

        // Constantes para arrastar janela
        public const int WM_NCLBUTTONDOWN = 0xA1;
        public const int HT_CAPTION = 0x2;

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern int SendMessage(IntPtr hWnd, int Msg, int wParam, int lParam);
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern bool ReleaseCapture();

        private void StartStatusMonitoring()
        {
            statusTimer.Start();
            Task.Run(CheckSystemStatus);
        }

        private async void StatusTimer_Tick(object sender, EventArgs e)
        {
            await CheckSystemStatus();
        }

        private async Task CheckSystemStatus()
        {
            try
            {
                bool backendRunning = await IsPortInUse(5000);
                bool frontendRunning = await IsPortInUse(3000);
                
                bool systemRunning = backendRunning && frontendRunning;
                
                if (this.InvokeRequired)
                {
                    this.Invoke(new Action(() => UpdateUI(systemRunning)));
                }
                else
                {
                    UpdateUI(systemRunning);
                }
            }
            catch
            {
                if (this.InvokeRequired)
                {
                    this.Invoke(new Action(() => UpdateUI(false)));
                }
                else
                {
                    UpdateUI(false);
                }
            }
        }

        private void UpdateUI(bool systemRunning)
        {
            isSystemRunning = systemRunning;
            
            if (systemRunning)
            {
                statusIconLabel.Text = "✅";
                statusIconLabel.ForeColor = Color.FromArgb(46, 204, 113);
                statusLabel.Text = "Sistema em execução";
                statusLabel.ForeColor = Color.FromArgb(46, 204, 113);
                controlButton.Text = "⏹️ PARAR SISTEMA";
                controlButton.BackColor = Color.FromArgb(231, 76, 60);
                controlButton.Enabled = true;
            }
            else
            {
                statusIconLabel.Text = "❌";
                statusIconLabel.ForeColor = Color.FromArgb(231, 76, 60);
                statusLabel.Text = "Sistema parado";
                statusLabel.ForeColor = Color.FromArgb(231, 76, 60);
                controlButton.Text = "▶️ INICIAR SISTEMA";
                controlButton.BackColor = Color.FromArgb(46, 204, 113);
                controlButton.Enabled = true;
            }
        }

        private async void ControlButton_Click(object sender, EventArgs e)
        {
            controlButton.Enabled = false;
            
            if (isSystemRunning)
            {
                await StopSystem();
            }
            else
            {
                await StartSystem();
            }
            
            // Verificar status após ação
            await Task.Delay(2000);
            await CheckSystemStatus();
        }

        private async Task<bool> IsPortInUse(int port)
        {
            try
            {
                if (port == 3000)
                {
                    // Para o frontend React, fazer requisição HTTP
                    using (var client = new HttpClient())
                    {
                        client.Timeout = TimeSpan.FromSeconds(3);
                        var response = await client.GetAsync($"http://localhost:{port}");
                        return response.IsSuccessStatusCode;
                    }
                }
                else if (port == 5000)
                {
                    // Para o backend, tentar tanto HTTP quanto TCP
                    try
                    {
                        using (var client = new HttpClient())
                        {
                            client.Timeout = TimeSpan.FromSeconds(2);
                            var response = await client.GetAsync($"http://localhost:{port}/api/health");
                            return response.IsSuccessStatusCode;
                        }
                    }
                    catch
                    {
                        // Se HTTP falhar, tentar TCP
                        using (var client = new System.Net.Sockets.TcpClient())
                        {
                            try
                            {
                                await client.ConnectAsync("localhost", port);
                                return client.Connected;
                            }
                            catch
                            {
                                return false;
                            }
                        }
                    }
                }
                else
                {
                    // Para outras portas, usar TCP
                    using (var client = new System.Net.Sockets.TcpClient())
                    {
                        try
                        {
                            await client.ConnectAsync("localhost", port);
                            return client.Connected;
                        }
                        catch
                        {
                            return false;
                        }
                    }
                }
            }
            catch
            {
                return false;
            }
        }

        private async Task StartSystem()
        {
            try
            {
                statusIconLabel.Text = "⚡";
                statusIconLabel.ForeColor = Color.Orange;
                statusLabel.Text = "Iniciando sistema...";
                statusLabel.ForeColor = Color.Orange;
                controlButton.Text = "⏳ Iniciando...";
                
                // Verificar Node.js
                if (!CheckNodeJs())
                {
                    MessageBox.Show("Node.js não encontrado. Por favor, instale o Node.js primeiro.", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Verificar dependências
                await CheckAndInstallDependencies();

                // Iniciar backend
                StartBackend();
                await Task.Delay(3000);

                // Iniciar frontend
                StartFrontend();
                await Task.Delay(5000);

                // Abrir navegador
                Process.Start(new ProcessStartInfo
                {
                    FileName = "http://localhost:3000",
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao iniciar sistema: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private async Task StopSystem()
        {
            try
            {
                statusIconLabel.Text = "⏳";
                statusIconLabel.ForeColor = Color.Orange;
                statusLabel.Text = "Parando sistema...";
                statusLabel.ForeColor = Color.Orange;
                controlButton.Text = "⏳ Parando...";

                // Matar todos os processos Node.js relacionados
                var nodeProcesses = Process.GetProcessesByName("node");
                foreach (var process in nodeProcesses)
                {
                    try
                    {
                        process.Kill();
                        process.WaitForExit(5000);
                    }
                    catch { }
                }

                // Matar processos cmd.exe relacionados ao npm
                var cmdProcesses = Process.GetProcesses()
                    .Where(p => p.ProcessName.Equals("cmd", StringComparison.OrdinalIgnoreCase))
                    .ToList();
                
                foreach (var process in cmdProcesses)
                {
                    try
                    {
                        if (process.MainWindowTitle.Contains("npm") || 
                            process.StartInfo.Arguments.Contains("npm"))
                        {
                            process.Kill();
                            process.WaitForExit(5000);
                        }
                    }
                    catch { }
                }

                await Task.Delay(2000);
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao parar sistema: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private bool CheckNodeJs()
        {
            try
            {
                var process = Process.Start(new ProcessStartInfo
                {
                    FileName = "node",
                    Arguments = "--version",
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                });
                process.WaitForExit();
                return process.ExitCode == 0;
            }
            catch
            {
                return false;
            }
        }

        private async Task CheckAndInstallDependencies()
        {
            string backendPath = Path.Combine(projectPath, "backend");
            string frontendPath = Path.Combine(projectPath, "frontend");

            if (!Directory.Exists(Path.Combine(backendPath, "node_modules")))
            {
                statusIconLabel.Text = "📦";
                statusIconLabel.ForeColor = Color.Orange;
                statusLabel.Text = "Instalando dependências do backend...";
                await RunNpmInstall(backendPath);
            }

            if (!Directory.Exists(Path.Combine(frontendPath, "node_modules")))
            {
                statusIconLabel.Text = "📦";
                statusIconLabel.ForeColor = Color.Orange;
                statusLabel.Text = "Instalando dependências do frontend...";
                await RunNpmInstall(frontendPath);
            }
        }

        private async Task RunNpmInstall(string workingDirectory)
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c npm install",
                    WorkingDirectory = workingDirectory,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                }
            };
            process.Start();
            await Task.Run(() => process.WaitForExit());
        }

        private void StartBackend()
        {
            try
            {
                backendProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c npm run dev",
                        WorkingDirectory = Path.Combine(projectPath, "backend"),
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    }
                };
                backendProcess.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao iniciar backend: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private void StartFrontend()
        {
            try
            {
                frontendProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/c npm start",
                        WorkingDirectory = Path.Combine(projectPath, "frontend"),
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    }
                };
                frontendProcess.Start();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Erro ao iniciar frontend: {ex.Message}", "Erro", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            statusTimer?.Stop();
            base.OnFormClosing(e);
        }
    }

    // Classe para botão moderno com cantos arredondados
    public class ModernButton : Button
    {
        protected override void OnPaint(PaintEventArgs pevent)
        {
            GraphicsPath path = new GraphicsPath();
            path.AddRoundedRectangle(this.ClientRectangle, 8);
            this.Region = new Region(path);
            
            pevent.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            
            // Gradiente de fundo
            using (LinearGradientBrush brush = new LinearGradientBrush(
                this.ClientRectangle,
                this.BackColor,
                Color.FromArgb(Math.Max(0, this.BackColor.R - 20), 
                              Math.Max(0, this.BackColor.G - 20), 
                              Math.Max(0, this.BackColor.B - 20)),
                LinearGradientMode.Vertical))
            {
                pevent.Graphics.FillPath(brush, path);
            }
            
            // Texto
            using (SolidBrush textBrush = new SolidBrush(this.ForeColor))
            {
                StringFormat sf = new StringFormat
                {
                    Alignment = StringAlignment.Center,
                    LineAlignment = StringAlignment.Center
                };
                pevent.Graphics.DrawString(this.Text, this.Font, textBrush, this.ClientRectangle, sf);
            }
            
            // Efeito hover
            if (this.ClientRectangle.Contains(this.PointToClient(Cursor.Position)) && this.Enabled)
            {
                using (SolidBrush hoverBrush = new SolidBrush(Color.FromArgb(30, Color.White)))
                {
                    pevent.Graphics.FillPath(hoverBrush, path);
                }
            }
        }
    }

    // Métodos de extensão para desenhar formas arredondadas
    public static class GraphicsExtensions
    {
        public static void FillRoundedRectangle(this Graphics graphics, Brush brush, Rectangle rect, int radius)
        {
            using (GraphicsPath path = new GraphicsPath())
            {
                path.AddRoundedRectangle(rect, radius);
                graphics.FillPath(brush, path);
            }
        }

        public static void DrawRoundedRectangle(this Graphics graphics, Pen pen, Rectangle rect, int radius)
        {
            using (GraphicsPath path = new GraphicsPath())
            {
                path.AddRoundedRectangle(rect, radius);
                graphics.DrawPath(pen, path);
            }
        }

        public static void AddRoundedRectangle(this GraphicsPath path, Rectangle rect, int radius)
        {
            if (radius <= 0)
            {
                path.AddRectangle(rect);
                return;
            }

            int diameter = radius * 2;
            Size size = new Size(diameter, diameter);
            Rectangle arc = new Rectangle(rect.Location, size);

            // Top left arc
            path.AddArc(arc, 180, 90);

            // Top right arc
            arc.X = rect.Right - diameter;
            path.AddArc(arc, 270, 90);

            // Bottom right arc
            arc.Y = rect.Bottom - diameter;
            path.AddArc(arc, 0, 90);

            // Bottom left arc
            arc.X = rect.Left;
            path.AddArc(arc, 90, 90);

            path.CloseFigure();
        }
    }
}