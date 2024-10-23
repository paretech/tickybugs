import tkinter as tk
from tkinter import filedialog
from PIL import Image, ImageTk
import csv
import os

class ImageLabeler:
    def __init__(self, root, image_paths, scale=2.0):
        self.root = root
        self.root.title("Image Labeler")
        
        self.image_paths = image_paths
        self.current_image_index = 0
        self.current_marker = None
        self.current_text = None  # To display coordinates
        self.current_text_background = None
        self.marker_radius = 5
        self.coordinates = []
        self.scale = scale  # Scale factor for displaying image

        # Create a frame for buttons at the top
        self.button_frame = tk.Frame(self.root)
        self.button_frame.pack(side=tk.TOP, fill=tk.X)
        
        # Navigation buttons
        self.next_button = tk.Button(self.button_frame, text="Next", command=self.save_and_next_image)
        self.next_button.pack(side=tk.RIGHT)
        self.prev_button = tk.Button(self.button_frame, text="Previous", command=self.prev_image)
        self.prev_button.pack(side=tk.LEFT)

        # Load first image
        self.load_image(self.image_paths[self.current_image_index])
        
        # Create canvas to display images
        self.canvas = tk.Canvas(self.root, width=self.img.width(), height=self.img.height())
        self.canvas.pack()

        # Display the first image
        self.image_on_canvas = self.canvas.create_image(0, 0, anchor=tk.NW, image=self.img)

        # Create initial horizontal and vertical lines
        self.h_line = self.canvas.create_line(0, 0, 400, 0, fill="red")  # Horizontal line (initially at y=0)
        self.v_line = self.canvas.create_line(0, 0, 0, 400, fill="red")  # Vertical line (initially at x=0)

        # Bind mouse movement to the update_reticle function
        self.canvas.bind("<Motion>", self.update_reticle)

        # Bind mouse click event to the canvas
        self.canvas.bind("<ButtonRelease-1>", self.on_click)

        # Bind Ctrl+S to save and next
        self.root.bind_all("<Control-s>", lambda event: self.save_and_next_image())
        
        # CSV file to save the points
        self.csv_file = open("image_points.csv", mode='w', newline='')
        self.csv_writer = csv.writer(self.csv_file)
        self.csv_writer.writerow(["Image Path", "X", "Y"])

    def update_reticle(self, event):
        # Update the position of the horizontal and vertical lines
        self.canvas.coords(self.h_line, 0, event.y, self.canvas.winfo_width(), event.y)  # Horizontal line
        self.canvas.coords(self.v_line, event.x, 0, event.x, self.canvas.winfo_height())  # Vertical line

    def load_image(self, image_path):
        """Load an image from the specified path and scale it."""
        self.original_image = Image.open(image_path)
        
        # Scale the image to double its original resolution
        scaled_size = (int(self.original_image.width * self.scale), int(self.original_image.height * self.scale))
        self.scaled_image = self.original_image.resize(scaled_size, Image.LANCZOS)
        
        # Create Tkinter-compatible image
        self.tk_image = ImageTk.PhotoImage(self.scaled_image)
        self.img = self.tk_image
    
    def on_click(self, event):
        """Handle mouse click on the image and map back to original coordinates."""
        # Remove the previous marker and text if any
        if self.current_marker:
            self.canvas.delete(self.current_marker)
        if self.current_text:
            self.canvas.delete(self.current_text)
        if self.current_text_background:
            self.canvas.delete(self.current_text_background)
            
        # Get coordinates of the click in the scaled image
        scaled_x, scaled_y = event.x, event.y
        
        # Map the coordinates back to the original resolution (sub-pixel accuracy)
        original_x = scaled_x / self.scale
        original_y = scaled_y / self.scale
        
        # Draw a small circle (marker) at the clicked location in the scaled image
        self.current_marker = self.canvas.create_oval(
            scaled_x - self.marker_radius, scaled_y - self.marker_radius,
            scaled_x + self.marker_radius, scaled_y + self.marker_radius,
            fill='red'
        )
        
        # Draw the coordinates (original resolution) next to the marker
        self.current_text = self.canvas.create_text(scaled_x + 10, scaled_y, anchor=tk.NW, text=f"({original_x:.2f}, {original_y:.2f})", fill='black')

        # Create the rectangle behind the text
        bbox = self.canvas.bbox(self.current_text)
        self.current_text_background = self.canvas.create_rectangle(bbox, fill='white', outline="")
        # Ensure the rectangle is drawn behind the text
        self.canvas.tag_lower(self.current_text_background, self.current_text)

        # Store coordinates for saving later
        self.coordinates = [original_x, original_y]

    def save_and_next_image(self):
        """Save the current image coordinates to CSV and load the next image."""
        if self.coordinates:
            # Save current image's coordinates to the CSV file
            image_path = self.image_paths[self.current_image_index]
            self.csv_writer.writerow([image_path, *self.coordinates])
        
        # Go to next image
        self.current_image_index += 1
        if self.current_image_index < len(self.image_paths):
            self.load_new_image()

    def prev_image(self):
        """Go back to the previous image."""
        if self.current_image_index > 0:
            self.current_image_index -= 1
            self.load_new_image()

    def load_new_image(self):
        """Load a new image and reset marker."""
        self.load_image(self.image_paths[self.current_image_index])
        self.canvas.config(width=self.img.width(), height=self.img.height())
        self.canvas.itemconfig(self.image_on_canvas, image=self.img)
        
        # Reset marker and coordinates
        self.canvas.delete(self.current_marker)
        self.canvas.delete(self.current_text)
        self.canvas.delete(self.current_text_background)
        self.current_marker = None
        self.current_text = None
        self.coordinates = []

    def on_close(self):
        """Handle application closing and close the CSV file."""
        self.csv_file.close()
        self.root.destroy()

def select_images():
    """Open file dialog to select multiple images."""
    return filedialog.askopenfilenames(title="Select Images", filetypes=[("Image files", "*.png;*.jpg;*.jpeg")])

if __name__ == "__main__":
    # Create the main application window
    root = tk.Tk()
    
    # Select images
    image_paths = select_images()
    
    if image_paths:
        # Create an instance of the ImageLabeler with 2x scaling
        app = ImageLabeler(root, image_paths, scale=1.0)
        
        # Handle window close event
        root.protocol("WM_DELETE_WINDOW", app.on_close)
        
        # Force focus so that keyboard shortcuts work
        root.focus_force()
        
        # Start the Tkinter event loop
        root.mainloop()
    else:
        print("No images selected.")
