from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from strawberry.django.views import GraphQLView

from shop.schema import schema

urlpatterns = [
    path("admin/", admin.site.urls),
    # csrf_exempt: demo API called from another origin (Angular).
    # Add real authentication before using this in production.
    path("graphql/", csrf_exempt(GraphQLView.as_view(schema=schema))),
]