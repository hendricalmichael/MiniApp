from decimal import Decimal
from typing import Optional

import strawberry
import strawberry_django
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db.models import Q
from graphql import GraphQLError
from strawberry import auto
from strawberry.types import Info

from . import models
from .auth import create_token, get_user

User = get_user_model()


# ---------- Types: what the API can return ----------

@strawberry_django.type(models.Category)
class CategoryType:
    id: auto
    name: auto
    slug: auto


@strawberry_django.type(models.Product)
class ProductType:
    id: auto
    name: auto
    slug: auto
    description: auto
    price: auto
    stock: auto
    category: CategoryType

    @strawberry_django.field
    def image_url(self) -> str:
        # self.image is a Cloudinary resource, or None when nothing was uploaded
        return self.image.url if self.image else ""


@strawberry_django.type(models.OrderItem)
class OrderItemType:
    id: auto
    quantity: auto
    unit_price: auto
    product: ProductType

    @strawberry_django.field
    def line_total(self) -> Decimal:
        return self.unit_price * self.quantity


@strawberry_django.type(models.Order)
class OrderType:
    id: auto
    customer_name: auto
    customer_email: auto
    shipping_address: auto
    status: auto
    total: auto
    created_at: auto
    items: list[OrderItemType]

@strawberry_django.type(User)
class UserType:
    id: auto
    email: auto
    is_staff: auto
    
    @strawberry_django.field
    def name(self) -> str:
        return self.first_name or self.username


@strawberry.type
class AuthPayload:
    token: str
    user: UserType

# ---------- Queries: the read operations ----------

@strawberry.type
class Query:
    @strawberry.field
    def me(self, info: Info) -> Optional[UserType]:
        return get_user(info.context.request)

    @strawberry.field
    def categories(self) -> list[CategoryType]:
        return models.Category.objects.all()

    @strawberry.field
    def products(
        self,
        category_slug: Optional[str] = None,
        search: Optional[str] = None,
    ) -> list[ProductType]:
        qs = models.Product.objects.filter(is_active=True).select_related("category")
        if category_slug:
            qs = qs.filter(category__slug=category_slug)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        return qs

    @strawberry.field
    def product(self, slug: str) -> Optional[ProductType]:
        return (
            models.Product.objects.filter(slug=slug, is_active=True)
            .select_related("category")
            .first()
        )

    @strawberry.field
    def order(self, id: strawberry.ID) -> Optional[OrderType]:
        return (
            models.Order.objects.filter(pk=id)
            .prefetch_related("items__product__category")
            .first()
        )

@strawberry.type
class Mutation:
    @strawberry.mutation
    def register(self, name: str, email: str, password: str) -> AuthPayload:
        email = email.strip().lower()
        if not name.strip():
            raise GraphQLError("Please enter your name.")
        try:
            validate_email(email)
        except ValidationError:
            raise GraphQLError("Enter a valid email address.")
        if len(email) > 150:
            raise GraphQLError("That email address is too long.")
        if User.objects.filter(username=email).exists():
            raise GraphQLError("An account with this email already exists.")
        try:
            validate_password(password)  # Django's built-in password rules
        except ValidationError as e:
            raise GraphQLError(" ".join(e.messages))

        user = User.objects.create_user(
            username=email, email=email, password=password, first_name=name.strip()
        )
        return AuthPayload(token=create_token(user), user=user)

    @strawberry.mutation
    def login(self, identifier: str, password: str) -> AuthPayload:
        identifier = identifier.strip()
        user = authenticate(username=identifier, password=password)
        if user is None and "@" in identifier:
            # customers log in with an email; find their username from it
            match = User.objects.filter(email__iexact=identifier).first()
            if match:
                user = authenticate(username=match.username, password=password)
        if user is None:
            raise GraphQLError("Wrong email or password.")
        return AuthPayload(token=create_token(user), user=user)


schema = strawberry.Schema(query=Query, mutation=Mutation)