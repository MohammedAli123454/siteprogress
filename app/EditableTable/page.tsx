"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash } from "lucide-react";

// Define the schema using Zod
const schema = z.object({
  items: z.array(
    z.object({
      code: z.string().min(1, "Select required"),
      description: z.string().min(1, "Description Required"),
      price: z.number().min(1, "Price Required"),
      qty: z.number().min(1, "Fill"),
      total: z.number().min(1, "Total Required"),
    })
  ),
});

// Infer the form's data type from the schema
type FormData = z.infer<typeof schema>;

export default function EditableForm() {
  const form = useForm<FormData>({
    defaultValues: {
      items: [{ code: "", description: "", price: 0, qty: 1, total: 0 }],
    },
    resolver: zodResolver(schema),
    mode: "onSubmit", // Ensure validation errors show only on submit
  });

  const { control, watch, setValue, handleSubmit, formState: { errors }, trigger } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const itemsList = [
    { code: "001", description: "Item A", price: 100 },
    { code: "002", description: "Item B", price: 200 },
    { code: "003", description: "Item C", price: 300 },
  ];

  const calculateTotals = () => {
    const items = watch("items");
    let totalQty = 0;
    let grandTotal = 0;
    items.forEach((item) => {
      totalQty += item.qty;
      grandTotal += item.total;
    });
    return { totalQty, grandTotal };
  };

  const updateItemDetails = (index: number, code: string) => {
    const selectedItem = itemsList.find(item => item.code === code);
    if (selectedItem) {
      setValue(`items.${index}.description`, selectedItem.description, { shouldDirty: true });
      setValue(`items.${index}.price`, selectedItem.price, { shouldDirty: true });
      setValue(`items.${index}.total`, selectedItem.price * watch(`items.${index}.qty`), { shouldDirty: true });
    }
  };

  const { totalQty, grandTotal } = calculateTotals();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  const handleAddRow = async () => {
    const currentIndex = fields.length - 1;
    const isCurrentRowValid = await trigger(`items.${currentIndex}`);

    if (isCurrentRowValid) {
      append({ code: "", description: "", price: 0, qty: 1, total: 0 }, { shouldFocus: false });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4">
        {fields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-12 gap-4 items-end w-full">
            <div className="col-span-2">
              {index === 0 && <FormLabel>Item Code</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.code`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Controller
                        control={control}
                        name={`items.${index}.code`}
                        render={({ field }) => (
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              updateItemDetails(index, value);
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Item" />
                            </SelectTrigger>
                            <SelectContent>
                              {itemsList.map((item) => (
                                <SelectItem key={item.code} value={item.code}>
                                  {item.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </FormControl>
                    <FormMessage>
                      {errors.items?.[index]?.code?.message}
                    </FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-5">
              {index === 0 && <FormLabel>Description</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-1.5">
              {index === 0 && <FormLabel>Price</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const price = parseFloat(e.target.value);
                          field.onChange(price);
                          setValue(
                            `items.${index}.total`,
                            price * watch(`items.${index}.qty`)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-1.5">
              {index === 0 && <FormLabel>Qty</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.qty`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        min="1"
                        onChange={(e) => {
                          const qty = parseInt(e.target.value);
                          field.onChange(qty);
                          setValue(
                            `items.${index}.total`,
                            watch(`items.${index}.price`) * qty
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage>{errors.items?.[index]?.qty?.message}</FormMessage>
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-1.5">
              {index === 0 && <FormLabel>Total</FormLabel>}
              <FormField
                control={control}
                name={`items.${index}.total`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} readOnly />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-1 flex justify-end">
              {index === 0 && <FormLabel>&nbsp;</FormLabel>}
              <Button variant="destructive" onClick={() => remove(index)} size="icon">
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button onClick={handleAddRow}>
          Add Row
        </Button>

        <Separator className="my-4" />

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-1.5 col-start-9">
            <Input value={totalQty} readOnly className="border-none font-bold text-center" />
          </div>
          <div className="col-span-1.5 col-start-10">
            <Input value={grandTotal} readOnly className="border-none font-bold text-center" />
          </div>
        </div>

        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
