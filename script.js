document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi Fabric.js pada elemen canvas
    const canvas = new fabric.Canvas('sertifikat-canvas');
    let textObject = null; // Variabel untuk menyimpan objek teks nama
    let backgroundImage = null; // Variabel untuk menyimpan gambar template

    // 1. Handle Upload Gambar Sertifikat
    const imageLoader = document.getElementById('imageLoader');
    imageLoader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (f) => {
            const data = f.target.result;
            fabric.Image.fromURL(data, (img) => {
                // Simpan gambar sebagai background
                backgroundImage = img;
                
                // Sesuaikan ukuran canvas dengan gambar
                canvas.setWidth(img.width);
                canvas.setHeight(img.height);
                canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
                    scaleX: canvas.width / img.width,
                    scaleY: canvas.height / img.height,
                });
            });
        };
        reader.readAsDataURL(file);
    });

    // 2. Tambah Teks Nama
    const addTextButton = document.getElementById('addText');
    addTextButton.addEventListener('click', () => {
        // Hanya tambah teks jika belum ada
        if (textObject) {
            canvas.setActiveObject(textObject);
            canvas.renderAll();
            return;
        }

        textObject = new fabric.IText('Nama Peserta', {
            left: canvas.width / 2 - 100,
            top: canvas.height / 2,
            fontFamily: 'Arial',
            fontSize: 40,
            fill: '#000000',
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
        });
        canvas.add(textObject);
        canvas.setActiveObject(textObject);
    });

    // 3. Atur Teks (Font dan Alignment)
    const fontSelector = document.getElementById('fontSelector');
    fontSelector.addEventListener('change', (e) => {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set('fontFamily', e.target.value);
            canvas.renderAll();
        }
    });

    document.getElementById('alignLeft').addEventListener('click', () => {
        updateAlignment('left');
    });
    document.getElementById('alignCenter').addEventListener('click', () => {
        updateAlignment('center');
    });
    document.getElementById('alignRight').addEventListener('click', () => {
        updateAlignment('right');
    });

    function updateAlignment(align) {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set('textAlign', align);
            canvas.renderAll();
        }
    }

    // 4 & 5. Generate dan Download Hasil
    const downloadButton = document.getElementById('downloadButton');
    const nameList = document.getElementById('nameList');
    const status = document.getElementById('status');

    downloadButton.addEventListener('click', async () => {
        if (!backgroundImage) {
            alert('Harap upload template sertifikat terlebih dahulu.');
            return;
        }
        if (!textObject) {
            alert('Harap tambahkan teks nama terlebih dahulu.');
            return;
        }

        const names = nameList.value.split('\n').filter(name => name.trim() !== '');
        if (names.length === 0) {
            alert('Harap masukkan setidaknya satu nama peserta di textarea.');
            return;
        }

        status.textContent = 'Memulai proses generate... (0/' + names.length + ')';
        
        // Inisialisasi JSZip
        const zip = new JSZip();

        // Simpan teks asli untuk dikembalikan nanti
        const originalText = textObject.text;

        // Loop untuk setiap nama
        for (let i = 0; i < names.length; i++) {
            const name = names[i].trim();
            status.textContent = `Memproses: ${name} (${i + 1}/${names.length})`;

            // Ganti teks di canvas
            textObject.set('text', name);
            canvas.renderAll();

            // Ekspor canvas sebagai gambar Data URL (PNG)
            const dataURL = canvas.toDataURL({
                format: 'png',
                quality: 1.0
            });
            
            // Dapatkan data base64 murni
            const base64Data = dataURL.replace(/^data:image\/(png|jpeg);base64,/, "");

            // **Tambahkan file ke ZIP dengan nama peserta (sesuai permintaan Anda)**
            zip.file(`${name}.png`, base64Data, { base64: true });

            // Beri jeda sedikit agar browser tidak freeze (opsional)
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Kembalikan teks ke placeholder awal
        textObject.set('text', originalText);
        canvas.renderAll();

        // Generate file ZIP
        status.textContent = 'Membuat file ZIP...';
        zip.generateAsync({ type: 'blob' })
            .then((blob) => {
                // Buat link download untuk file ZIP
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = 'sertifikat_peserta.zip';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                status.textContent = 'Selesai! File ZIP berhasil di-download.';
            });
    });
});
