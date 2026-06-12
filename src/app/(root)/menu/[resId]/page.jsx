"use client";
import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useMenu } from "@/store/hooks/useMenu";
import CatalogueList from "@/components/features/menu/category-list";
import CategorySidebar from "@/components/features/menu/category-sidebar";

export default function Page() {
    const { resId } = useParams();

    const { fetchMenu, menu, loading, error, activeSubCategory } = useMenu(resId);

    useEffect(() => {
        if (resId) {
            fetchMenu();
        }
    }, [resId, fetchMenu]);

    const catalogues = useMemo(() => {
        if (
            !menu?.catalogueWrappers ||
            !activeSubCategory
        ) {
            return [];
        }

        const subCategory =
            menu.categoryWrappers
                ?.flatMap(
                    (category) =>
                        category.subCategoryWrappers || []
                )
                ?.find(
                    (sub) =>
                        sub.subCategory.subCategoryId ===
                        activeSubCategory ||
                        sub.subCategory.tempReferenceId ===
                        activeSubCategory
                );

        const catalogueIds =
            subCategory?.subCategoryEntities
                ?.filter(
                    (entity) =>
                        entity.entityType?.toLowerCase() ===
                        "catalogue"
                )
                ?.map((entity) => entity.entityId) || [];

        return menu.catalogueWrappers
            .filter((wrapper) =>
                catalogueIds.includes(
                    wrapper.catalogue.catalogueId
                )
            )
            .map((wrapper) => ({
                id: wrapper.catalogue.catalogueId,
                resId: wrapper.catalogue.resId,
                name: wrapper.catalogue.name,
                description:
                    wrapper.catalogue.description,
                imageUrl:
                    wrapper.catalogue.thumbUrl,
                thumbUrl:
                    wrapper.catalogue.thumbUrl,
                imageHash:
                    wrapper.catalogue.imageHash,
                isVisible:
                    wrapper.catalogue.isVisible,
                inStock:
                    wrapper.catalogue.inStock,
                onHoldStatus:
                    wrapper.catalogue.onHoldStatus,
                turnOnTime:
                    wrapper.catalogue.turnOnTime,
                tags:
                    wrapper.catalogueTags || [],
                price:
                    wrapper.variantWrappers?.[0]
                        ?.variantPrices?.[0]?.price ||
                    0,
                raw: wrapper,
            }));
    }, [menu, activeSubCategory]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                Loading...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                {error}
            </div>
        );
    }

    return (
        <div className="flex h-screen">
            <CategorySidebar
                resId={resId}
            />
            <div className="flex-1">
                {activeSubCategory ? (
                    <>
                        {/* <pre className="text-xs overflow-auto"> */}
                        {/* {JSON.stringify(menu ?? {}, null, 2)} */}
                        {/* </pre><CatalogueList items={catalogues} resId={resId} /> */}
                    </>

                ) : (
                    <div className="flex h-full items-center justify-center">
                        <div className="text-center">
                            <h3 className="text-lg font-medium">
                                Select a Subcategory
                            </h3>

                            <p className="text-sm text-muted-foreground">
                                Choose a subcategory from the left sidebar
                                to view menu items.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}