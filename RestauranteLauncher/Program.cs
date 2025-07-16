using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Sockets;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace RestauranteLauncher
{
    public partial class SplashForm : Form
    {
        private ProgressBar progressBar;
        private Label statusLabel;
        private Label titleLabel;
        private PictureBox logoBox;
        private System.Windows.Forms.Timer progressTimer;
        private int progressValue = 0;
        private string currentStatus = "Iniciando...";

        public SplashForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Size = new Size(500, 300);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.None;
            this.BackColor = Color.FromArgb(45, 45, 48);
            this.Text = "Sistema do Restaurante";

            // Logo/Ícone
            logoBox = new PictureBox
            {
                Size = new Size(80, 80),
                Location = new Point(210, 50),
                BackColor = Color.FromArgb(0, 122, 204),
                SizeMode = PictureBoxSizeMode.CenterImage
            };
            this.Controls.Add(logoBox);

            // Título
            titleLabel = new Label
            {
                Text = "Sistema do Restaurante",
                Font = new Font("Segoe UI", 18, FontStyle.Bold),
                ForeColor = Color.White,
                Size = new Size(400, 40),
                Location = new Point(50, 140),
                TextAlign = ContentAlignment.MiddleCenter
            };
            this.Controls.Add(titleLabel);

            // Status
            statusLabel = new Label
            {
                Text = currentStatus,
                Font = new Font("Segoe UI", 10),
                ForeColor = Color.LightGray,
                Size = new Size(400, 25),
                Location = new Point(50, 180),
                TextAlign = ContentAlignment.MiddleCenter
            };
            this.Controls.Add(statusLabel);

            // Barra de progresso
            progressBar = new ProgressBar
            {
                Size = new Size(350, 20),
                Location = new Point(75, 220),
                Style = ProgressBarStyle.Continuous,
                Minimum = 0,
                Maximum = 100
            };
            this.Controls.Add(progressBar);

            // Timer para animação
            progressTimer = new System.Windows.Forms.Timer
            {
                Interval = 100
            };
            progressTimer.Tick += ProgressTimer_Tick;
        }

        private void ProgressTimer_Tick(object sender, EventArgs e)
        {
            if (progressValue < 100)
            {
                progressValue += 2;
                progressBar.Value = Math.Min(progressValue, 100);
            }
        }

        public void UpdateStatus(string status)
        {
            if (statusLabel.InvokeRequired)
            {
                statusLabel.Invoke(new Action(() => statusLabel.Text = status));
            }
            else
            {
                statusLabel.Text = status;
            }
        }

        public void SetProgress(int value)
        {
            if (progressBar.InvokeRequired)
            {
                progressBar.Invoke(new Action(() => progressBar.Value = Math.Min(value, 100)));
            }
            else
            {
                progressBar.Value = Math.Min(value, 100);
            }
        }

        public void StartProgressAnimation()
        {
            progressTimer.Start();
        }

        public void StopProgressAnimation()
        {
            progressTimer.Stop();
        }
    }

    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            Application.Run(new ControllerForm());
        }


    }
}