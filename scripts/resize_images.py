import os
from PIL import Image

source_path = '/tmp/file_attachments/file_0000000046e8820eb9d29ba024bf6901.png'
dest_dir = 'public'

# Open high-quality source image
img = Image.open(source_path)

# 1. Resize helper function
def resize_and_save(img, size, dest_filename):
    # Use Lanczos resampling (formerly Resampling.LANCZOS or ANTIALIAS)
    # Ensure backward compatibility with pillow versions
    try:
        resample_method = Image.Resampling.LANCZOS
    except AttributeError:
        resample_method = Image.ANTIALIAS

    resized = img.resize((size, size), resample=resample_method)
    dest_path = os.path.join(dest_dir, dest_filename)
    resized.save(dest_path)
    print(f"Saved {dest_path} with size {size}x{size}")

# 2. Process all PNG target outputs
resize_and_save(img, 192, '192x192.png')
resize_and_save(img, 192, 'pwa-192x192.png')
resize_and_save(img, 512, 'pwa-512x512.png')
resize_and_save(img, 64, 'pwa-64x64.png')
resize_and_save(img, 512, 'lb_logo.png')

# 3. Process JPEG target output (no alpha channel needed/supported by JPEG)
try:
    resample_method = Image.Resampling.LANCZOS
except AttributeError:
    resample_method = Image.ANTIALIAS

# Save as JPEG (which is an RGB format). If the source is RGB, we can directly save.
# Let's ensure it is in RGB mode before saving.
jpeg_img = img.convert('RGB')
jpeg_resized = jpeg_img.resize((512, 512), resample=resample_method)
jpeg_dest_path = os.path.join(dest_dir, 'lb_logo.jpg')
jpeg_resized.save(jpeg_dest_path, 'JPEG', quality=95)
print(f"Saved {jpeg_dest_path} with size 512x512 as JPEG")
