import { Request, Response } from "express";
import { ChecklistItemModel } from "../models/ChecklistItem";

export const getChecklist = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;
    const { category } = request.query;

    const filterQuery: Record<string, unknown> = { tripId };
    if (category) {
      filterQuery.category = category;
    }

    const checklistItems = await ChecklistItemModel.find(filterQuery).sort({
      orderIndex: 1,
      createdAt: 1,
    });

    const totalCount = checklistItems.length;
    const completedCount = checklistItems.filter(
      (checklistItem) => checklistItem.isCompleted
    ).length;

    response.json({
      success: true,
      data: {
        items: checklistItems,
        totalCount,
        completedCount,
        progressPercentage:
          totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      },
    });
  } catch (fetchError) {
    console.error("Error fetching checklist items:", fetchError);
    response.status(500).json({
      success: false,
      message: "Failed to fetch checklist items",
    });
  }
};

export const createChecklistItem = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { tripId } = request.params;
    const { itemText, category } = request.body;

    if (!itemText) {
      response.status(400).json({
        success: false,
        message: "Item text is required",
      });
      return;
    }

    const highestOrderItem = await ChecklistItemModel.findOne({ tripId }).sort({
      orderIndex: -1,
    });
    const nextOrderIndex = highestOrderItem ? highestOrderItem.orderIndex + 1 : 0;

    const newItem = await ChecklistItemModel.create({
      tripId,
      itemText: itemText.trim(),
      category: category || "General",
      isCompleted: false,
      orderIndex: nextOrderIndex,
    });

    response.status(201).json({
      success: true,
      data: newItem,
    });
  } catch (createError) {
    console.error("Error creating checklist item:", createError);
    response.status(500).json({
      success: false,
      message: "Failed to create checklist item",
    });
  }
};

export const updateChecklistItem = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { itemId } = request.params;

    const updatedItem = await ChecklistItemModel.findByIdAndUpdate(
      itemId,
      { $set: request.body },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      response.status(404).json({
        success: false,
        message: "Checklist item not found",
      });
      return;
    }

    response.json({
      success: true,
      data: updatedItem,
    });
  } catch (updateError) {
    console.error("Error updating checklist item:", updateError);
    response.status(500).json({
      success: false,
      message: "Failed to update checklist item",
    });
  }
};

export const deleteChecklistItem = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { itemId } = request.params;

    const deletedItem = await ChecklistItemModel.findByIdAndDelete(itemId);
    if (!deletedItem) {
      response.status(404).json({
        success: false,
        message: "Checklist item not found",
      });
      return;
    }

    response.json({
      success: true,
      message: "Checklist item deleted successfully",
    });
  } catch (deleteError) {
    console.error("Error deleting checklist item:", deleteError);
    response.status(500).json({
      success: false,
      message: "Failed to delete checklist item",
    });
  }
};
