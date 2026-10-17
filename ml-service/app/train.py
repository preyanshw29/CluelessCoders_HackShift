"""
FasalSakshi - PlantVillage Tomato Disease Model Training Script
Performs transfer learning using MobileNetV2 on the 10 PlantVillage Tomato classes.
"""

import argparse
import os
import pathlib
import sys
from typing import Dict, Tuple

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, random_split
    from torchvision import datasets, models, transforms
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False

from app.taxonomy import TOMATO_CLASSES

DEFAULT_OUTPUT_DIR = pathlib.Path(__file__).parent.parent / "models"


def get_data_transforms() -> Dict[str, transforms.Compose]:
    """Define robust data augmentations for agricultural foliage images."""
    if not TORCH_AVAILABLE:
        raise ImportError("PyTorch and torchvision are required for model training.")

    return {
        "train": transforms.Compose([
            transforms.RandomResizedCrop(224, scale=(0.8, 1.0)),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.1, contrast=0.1, saturation=0.1),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]),
        "val": transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]),
    }


def build_model(num_classes: int = len(TOMATO_CLASSES)) -> nn.Module:
    """Build MobileNetV2 backbone with custom linear classifier head."""
    model = models.mobilenet_v2(weights=models.MobileNet_V2_Weights.DEFAULT)
    in_features = model.classifier[1].in_features
    # Replace final linear layer with 10 Tomato classes
    model.classifier[1] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes),
    )
    return model


def train_model(
    data_dir: str,
    epochs: int = 10,
    batch_size: int = 32,
    lr: float = 1e-4,
    save_path: pathlib.Path = DEFAULT_OUTPUT_DIR / "tomato_disease_model.pth",
):
    """Execute training loop with validation checks and save checkpoint."""
    if not TORCH_AVAILABLE:
        print("[Error] PyTorch is not installed in the active environment.")
        sys.exit(1)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[Training] Using compute device: {device}")

    data_path = pathlib.Path(data_dir)
    if not data_path.exists():
        raise FileNotFoundError(f"Dataset path '{data_dir}' does not exist.")

    transforms_dict = get_data_transforms()
    full_dataset = datasets.ImageFolder(root=str(data_path), transform=transforms_dict["train"])

    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=2)

    model = build_model(len(TOMATO_CLASSES)).to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    best_val_acc = 0.0
    save_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"[Training] Beginning training over {epochs} epochs...")
    for epoch in range(1, epochs + 1):
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        epoch_loss = running_loss / total
        epoch_acc = (correct / total) * 100.0

        # Validation phase
        model.eval()
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        val_acc = (val_correct / val_total) * 100.0 if val_total > 0 else 0.0
        print(f"Epoch [{epoch:02d}/{epochs:02d}] Train Loss: {epoch_loss:.4f} | Train Acc: {epoch_acc:.2f}% | Val Acc: {val_acc:.2f}%")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), str(save_path))
            print(f" -> Checkpoint saved with new best validation accuracy: {best_val_acc:.2f}%")

    print(f"[Training Complete] Model weights successfully exported to: {save_path}")


def main():
    parser = argparse.ArgumentParser(description="Train PlantVillage Tomato Disease Model")
    parser.add_argument("--data-dir", type=str, required=True, help="Directory containing PlantVillage tomato class folders")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=32, help="Mini-batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Learning rate for Adam optimizer")
    parser.add_argument("--save-path", type=str, default=str(DEFAULT_OUTPUT_DIR / "tomato_disease_model.pth"))
    args = parser.parse_args()

    train_model(
        data_dir=args.data_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        save_path=pathlib.Path(args.save_path),
    )


if __name__ == "__main__":
    main()
