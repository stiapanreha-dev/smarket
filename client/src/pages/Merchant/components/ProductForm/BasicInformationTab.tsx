/**
 * Basic Information Tab
 *
 * Product name, description (EditorJS), category, type, tags
 */

import { useEffect, useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Form, Row, Col, Badge } from 'react-bootstrap';
import EditorJS from '@editorjs/editorjs';
import type { OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Link from '@editorjs/link';
import { ProductType } from '@/types/catalog';

interface BasicInformationTabProps {
  control: any;
  errors: any;
  watch: any;
  setValue: any;
}

// Sample categories - in real app, fetch from API
const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
  'Health & Beauty',
  'Food & Beverage',
  'Services',
  'Digital Products',
];

export const BasicInformationTab = ({
  control,
  errors,
  watch,
  setValue,
}: BasicInformationTabProps) => {
  const editorRef = useRef<EditorJS | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const description = watch('description');
  const selectedCategories = watch('category') || [];
  const tags = watch('tags') || [];

  // Initialize EditorJS
  useEffect(() => {
    if (!editorContainerRef.current || editorRef.current) return;

    const editor = new EditorJS({
      holder: editorContainerRef.current,
      tools: {
        header: {
          class: Header,
          config: {
            levels: [2, 3, 4],
            defaultLevel: 2,
          },
        },
        list: {
          class: List,
          inlineToolbar: true,
        },
        quote: Quote,
        link: Link,
      },
      data: description ? JSON.parse(description) : undefined,
      placeholder: 'Write your product description here...',
      onChange: async () => {
        if (editorRef.current) {
          const data = await editorRef.current.save();
          setValue('description', JSON.stringify(data), { shouldDirty: true });
        }
      },
      onReady: () => {
        setIsEditorReady(true);
      },
    });

    editorRef.current = editor;

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy();
        editorRef.current = null;
      }
    };
  }, []);

  // Update editor content when description changes externally
  useEffect(() => {
    if (isEditorReady && editorRef.current && description) {
      try {
        const data = JSON.parse(description);
        editorRef.current.render(data);
      } catch (e) {
        // If description is plain text, convert to EditorJS format
        editorRef.current.render({
          blocks: [
            {
              type: 'paragraph',
              data: {
                text: description,
              },
            },
          ],
        });
      }
    }
  }, [isEditorReady]);

  // Handlers
  const handleCategoryToggle = (category: string) => {
    const current = selectedCategories;
    if (current.includes(category)) {
      setValue(
        'category',
        current.filter((c: string) => c !== category),
        { shouldDirty: true }
      );
    } else {
      setValue('category', [...current, category], { shouldDirty: true });
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim();
      if (tag && !tags.includes(tag)) {
        setValue('tags', [...tags, tag], { shouldDirty: true });
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue(
      'tags',
      tags.filter((t: string) => t !== tagToRemove),
      { shouldDirty: true }
    );
  };

  return (
    <div className="tab-content-wrapper">
      {/* Product Name */}
      <Form.Group className="mb-4">
        <Form.Label>
          Product Name <span className="text-danger">*</span>
        </Form.Label>
        <Controller
          name="title"
          control={control}
          render={({ field }) => (
            <Form.Control
              {...field}
              type="text"
              placeholder="Enter product name"
              isInvalid={!!errors.title}
            />
          )}
        />
        <Form.Control.Feedback type="invalid">
          {errors.title?.message}
        </Form.Control.Feedback>
        <Form.Text className="text-muted">
          A clear, descriptive name helps customers find your product
        </Form.Text>
      </Form.Group>

      {/* Product Type */}
      <Form.Group className="mb-4">
        <Form.Label>
          Product Type <span className="text-danger">*</span>
        </Form.Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <div>
              <Form.Check
                {...field}
                type="radio"
                id="type-physical"
                label="Physical Product"
                value={ProductType.PHYSICAL}
                checked={field.value === ProductType.PHYSICAL}
                onChange={() => field.onChange(ProductType.PHYSICAL)}
              />
              <Form.Text className="text-muted ms-4 d-block mb-2">
                Tangible items that require shipping
              </Form.Text>

              <Form.Check
                {...field}
                type="radio"
                id="type-digital"
                label="Digital Product"
                value={ProductType.COURSE}
                checked={field.value === ProductType.COURSE}
                onChange={() => field.onChange(ProductType.COURSE)}
              />
              <Form.Text className="text-muted ms-4 d-block mb-2">
                Downloadable files, courses, ebooks, etc.
              </Form.Text>

              <Form.Check
                {...field}
                type="radio"
                id="type-service"
                label="Service"
                value={ProductType.SERVICE}
                checked={field.value === ProductType.SERVICE}
                onChange={() => field.onChange(ProductType.SERVICE)}
              />
              <Form.Text className="text-muted ms-4 d-block">
                Consultations, appointments, bookings, etc.
              </Form.Text>
            </div>
          )}
        />
        {errors.type && (
          <div className="text-danger small mt-2">{errors.type?.message}</div>
        )}
      </Form.Group>

      {/* Description (EditorJS) */}
      <Form.Group className="mb-4">
        <Form.Label>Product Description</Form.Label>
        <div
          ref={editorContainerRef}
          className="editor-container"
          style={{
            border: '1px solid #dee2e6',
            borderRadius: '0.375rem',
            minHeight: '300px',
            padding: '1rem',
          }}
        />
        <Form.Text className="text-muted">
          Provide detailed information about your product
        </Form.Text>
      </Form.Group>

      {/* Category */}
      <Form.Group className="mb-4">
        <Form.Label>Categories</Form.Label>
        <div className="category-selector">
          {CATEGORIES.map((category) => (
            <Badge
              key={category}
              bg={selectedCategories.includes(category) ? 'primary' : 'light'}
              text={selectedCategories.includes(category) ? 'white' : 'dark'}
              className="me-2 mb-2 cursor-pointer"
              style={{ cursor: 'pointer', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              onClick={() => handleCategoryToggle(category)}
            >
              {category}
              {selectedCategories.includes(category) && (
                <i className="bi bi-check ms-2"></i>
              )}
            </Badge>
          ))}
        </div>
        <Form.Text className="text-muted">
          Select one or more categories that fit your product
        </Form.Text>
      </Form.Group>

      {/* Tags */}
      <Form.Group className="mb-4">
        <Form.Label>Tags</Form.Label>
        <Form.Control
          type="text"
          placeholder="Type a tag and press Enter or comma"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
        />
        <Form.Text className="text-muted">
          Press Enter or comma to add tags (e.g., organic, handmade, eco-friendly)
        </Form.Text>
        {tags.length > 0 && (
          <div className="mt-2">
            {tags.map((tag: string) => (
              <Badge
                key={tag}
                bg="secondary"
                className="me-2 mb-2"
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                {tag}
                <i
                  className="bi bi-x ms-2 cursor-pointer"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleRemoveTag(tag)}
                ></i>
              </Badge>
            ))}
          </div>
        )}
      </Form.Group>
    </div>
  );
};
