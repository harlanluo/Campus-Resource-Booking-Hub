package com.campusbooking.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.io.IOException;
import java.util.List;

@Data
public class KitCreateRequestDTO {
    @NotBlank @Size(max = 100)
    private String name;
    @Size(max = 500)
    private String description;
    @NotEmpty
    @JsonDeserialize(contentUsing = ResourceIdDeserializer.class)
    private List<@NotNull @Positive Long> resourceIds;

    /** Reject coercion that could silently select a different resource. */
    public static class ResourceIdDeserializer extends JsonDeserializer<Long> {
        @Override
        public Long deserialize(JsonParser parser, DeserializationContext context) throws IOException {
            if (!parser.hasToken(JsonToken.VALUE_NUMBER_INT)) {
                return (Long) context.handleUnexpectedToken(Long.class, parser);
            }
            return parser.getLongValue();
        }
    }
}
